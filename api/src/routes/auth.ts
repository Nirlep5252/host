import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, users } from "../db";
import type { Bindings, Variables } from "../types";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

auth.post("/check-user", async (c) => {
  const body = await c.req.json<{ email: string }>();
  const email = body.email?.toLowerCase().trim();

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return c.json({ exists: existingUser.length > 0 });
});

export default auth;
