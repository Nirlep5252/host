import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createDb, users, type User } from "../db";
import type { Bindings } from "../types";

type AuthVariables = {
  user: User;
};

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "API key required" }, 401);
  }

  const db = createDb(c.env.DATABASE_URL);
  const allUsers = await db.select().from(users).where(eq(users.isActive, true));

  let matchedUser: User | null = null;
  for (const user of allUsers) {
    if (await bcrypt.compare(apiKey, user.apiKeyHash)) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  c.set("user", matchedUser);
  await next();
});

export const adminMiddleware = createMiddleware<{
  Bindings: Bindings;
}>(async (c, next) => {
  const adminKey = c.req.header("X-Admin-Key");

  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
