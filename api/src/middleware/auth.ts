import { createMiddleware } from "hono/factory";
import { eq, and } from "drizzle-orm";
import { createDb, users, apiKeys, type User } from "../db";
import { hashApiKey } from "../lib/api-keys";
import { createAuth } from "../lib/auth";
import type { Bindings } from "../types";

type AuthVariables = {
  user: User;
};

export async function verifyApiKey(
  db: ReturnType<typeof createDb>,
  apiKey: string
): Promise<User | null> {
  if (!apiKey || !apiKey.startsWith("sk_")) {
    return null;
  }

  const hashedKey = await hashApiKey(apiKey);

  const [result] = await db
    .select({ user: users, apiKey: apiKeys })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(and(eq(apiKeys.keyHash, hashedKey), eq(users.isActive, true)));

  if (!result) return null;

  // Update lastUsedAt in background (don't await)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.keyHash, hashedKey))
    .execute()
    .catch(() => {});

  return result.user;
}

export async function verifySessionUser(
  db: ReturnType<typeof createDb>,
  env: Bindings,
  headers: Headers
): Promise<User | null> {
  const auth = createAuth(db, env);

  try {
    const sessionData = await auth.api.getSession({ headers });
    const sessionUser = sessionData?.user as User | undefined;

    if (!sessionUser) {
      return null;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionUser.id), eq(users.isActive, true)));

    return user ?? null;
  } catch {
    return null;
  }
}

async function verifyRequestUser(
  db: ReturnType<typeof createDb>,
  env: Bindings,
  headers: Headers,
  apiKey?: string
): Promise<User | null> {
  if (apiKey) {
    const apiKeyUser = await verifyApiKey(db, apiKey);
    if (apiKeyUser) {
      return apiKeyUser;
    }
  }

  return verifySessionUser(db, env, headers);
}

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const db = createDb(c.env.DATABASE_URL);
  const matchedUser = await verifyRequestUser(
    db,
    c.env,
    c.req.raw.headers,
    apiKey
  );

  if (!matchedUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", matchedUser);
  await next();
});

export const adminMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  const user = await verifySessionUser(db, c.env, c.req.raw.headers);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("user", user);
  await next();
});
