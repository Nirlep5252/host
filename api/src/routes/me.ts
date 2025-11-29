import { Hono } from "hono";
import { eq, and, isNull, count } from "drizzle-orm";
import { createDb, images } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { Bindings, Variables } from "../types";

const me = new Hono<{ Bindings: Bindings; Variables: Variables }>();

me.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DATABASE_URL);

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
  });
});

export default me;
