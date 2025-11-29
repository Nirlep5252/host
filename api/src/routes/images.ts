import { Hono } from "hono";
import { eq, and, isNull, desc } from "drizzle-orm";
import { getFile, deleteFile } from "../storage";
import { createDb, images } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { Bindings, Variables } from "../types";
import bcrypt from "bcryptjs";
import { users } from "../db";

const imagesRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

imagesRoute.get("/list", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DATABASE_URL);

  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  const userImages = await db
    .select()
    .from(images)
    .where(and(eq(images.userId, user.id), isNull(images.deletedAt)))
    .orderBy(desc(images.createdAt))
    .limit(limit)
    .offset(offset);

  const baseUrl = c.env.BASE_URL || "http://localhost:3000";

  return c.json({
    images: userImages.map((img) => ({
      id: img.id,
      url: `${baseUrl}/i/${img.id}`,
      originalName: img.originalName,
      contentType: img.contentType,
      sizeBytes: img.sizeBytes,
      isPrivate: img.isPrivate,
      createdAt: img.createdAt,
    })),
    limit,
    offset,
  });
});

imagesRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DATABASE_URL);

  const [image] = await db
    .select()
    .from(images)
    .where(and(eq(images.id, id), isNull(images.deletedAt)));

  if (!image) {
    return c.json({ error: "Not found" }, 404);
  }

  if (image.isPrivate) {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey) {
      return c.json({ error: "This image is private" }, 403);
    }

    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    let isOwner = false;

    for (const user of allUsers) {
      if (await bcrypt.compare(apiKey, user.apiKeyHash)) {
        if (user.id === image.userId) {
          isOwner = true;
        }
        break;
      }
    }

    if (!isOwner) {
      return c.json({ error: "This image is private" }, 403);
    }
  }

  const result = await getFile(c.env.R2, id);
  if (!result) {
    return c.json({ error: "File not found in storage" }, 404);
  }

  return new Response(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": image.isPrivate
        ? "private, no-cache"
        : "public, max-age=31536000, immutable",
    },
  });
});

imagesRoute.patch("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = createDb(c.env.DATABASE_URL);

  const [image] = await db
    .select()
    .from(images)
    .where(
      and(eq(images.id, id), eq(images.userId, user.id), isNull(images.deletedAt))
    );

  if (!image) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.json<{ isPrivate?: boolean }>();

  if (typeof body.isPrivate === "boolean") {
    await db
      .update(images)
      .set({ isPrivate: body.isPrivate })
      .where(eq(images.id, id));
  }

  return c.json({ success: true, id, isPrivate: body.isPrivate ?? image.isPrivate });
});

imagesRoute.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const db = createDb(c.env.DATABASE_URL);

  const [image] = await db
    .select()
    .from(images)
    .where(
      and(eq(images.id, id), eq(images.userId, user.id), isNull(images.deletedAt))
    );

  if (!image) {
    return c.json({ error: "Not found" }, 404);
  }

  await db
    .update(images)
    .set({ deletedAt: new Date() })
    .where(eq(images.id, id));

  await deleteFile(c.env.R2, id);

  return c.json({ success: true, id });
});

export default imagesRoute;
