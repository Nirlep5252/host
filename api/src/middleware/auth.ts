import { createMiddleware } from "hono/factory";
import { eq, and } from "drizzle-orm";
import { createDb, users, type User } from "../db";
import type { Bindings } from "../types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { PgDatabase } from "drizzle-orm/pg-core";

type AuthVariables = {
  user: User;
};

export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyApiKey(
  db: ReturnType<typeof createDb>,
  apiKey: string
): Promise<User | null> {
  if (!apiKey || !apiKey.startsWith("sk_")) {
    return null;
  }

  const hashedKey = await hashApiKey(apiKey);

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.apiKeyHash, hashedKey), eq(users.isActive, true)));

  return user || null;
}

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "API key required" }, 401);
  }

  const db = createDb(c.env.DATABASE_URL);
  const matchedUser = await verifyApiKey(db, apiKey);

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
