import { Hono } from "hono";
import { eq, and, isNull, desc } from "drizzle-orm";
import { getFile, deleteFile } from "../storage";
import { createDb, images } from "../db";
import { authMiddleware, verifyApiKey } from "../middleware/auth";
import { publicImageRateLimit } from "../middleware/rate-limit";
import type { Bindings, Variables } from "../types";

const imagesRoute = new Hono<{ Bindings: Bindings; Variables: Variables }>();

imagesRoute.get("/list", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const db = createDb(c.env.DATABASE_URL);

    const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 100);
    const offset = parseInt(c.req.query("offset") || "0", 10);

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
  } catch (error) {
    console.error("Failed to list images:", error);
    return c.json({ error: "Failed to list images" }, 500);
  }
});

imagesRoute.get("/:id", publicImageRateLimit, async (c) => {
  const id = c.req.param("id");

  try {
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

      const user = await verifyApiKey(db, apiKey);
      if (!user || user.id !== image.userId) {
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
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "X-Frame-Options": "DENY",
        "Content-Disposition": `inline; filename="${image.originalName || image.id}"`,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve image:", error);
    return c.json({ error: "Failed to retrieve image" }, 500);
  }
});

imagesRoute.patch("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  try {
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
  } catch (error) {
    console.error("Failed to update image:", error);
    return c.json({ error: "Failed to update image" }, 500);
  }
});

imagesRoute.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  try {
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
  } catch (error) {
    console.error("Failed to delete image:", error);
    return c.json({ error: "Failed to delete image" }, 500);
  }
});

export default imagesRoute;
