import { Hono } from "hono";
import { eq, and, isNull, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, images, users, type User } from "../db";
import { verifyApiKey, hashApiKey } from "../middleware/auth";
import { sessionMiddleware, requireSession } from "../middleware/session";
import type { Bindings, Variables } from "../types";

const me = new Hono<{ Bindings: Bindings; Variables: Variables }>();

me.use("/*", sessionMiddleware);

me.get("/", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  let user: User | null = null;

  const sessionUser = c.get("sessionUser");
  if (sessionUser) {
    user = sessionUser;
  } else {
    const apiKey = c.req.header("X-API-Key");
    if (apiKey) {
      user = await verifyApiKey(db, apiKey);
    }
  }

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const [stats] = await db
      .select({ count: count() })
      .from(images)
      .where(and(eq(images.userId, user.id), isNull(images.deletedAt)));

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      imageCount: stats?.count || 0,
      isAdmin: user.email === c.env.ADMIN_EMAIL,
      hasApiKey: !!user.apiKeyHash,
    });
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return c.json({ error: "Failed to fetch user info" }, 500);
  }
});

me.post("/regenerate-key", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const newKey = `sk_${nanoid(32)}`;
    const hash = await hashApiKey(newKey);

    await db
      .update(users)
      .set({ apiKeyHash: hash })
      .where(eq(users.id, sessionUser.id));

    return c.json({
      apiKey: newKey,
      message: "API key regenerated successfully. Save this key - it won't be shown again.",
    });
  } catch (error) {
    console.error("Failed to regenerate API key:", error);
    return c.json({ error: "Failed to regenerate API key" }, 500);
  }
});

me.get("/api-key", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    hasApiKey: !!sessionUser.apiKeyHash,
  });
});

export default me;
