import { Hono } from "hono";
import { eq, and, isNull, desc } from "drizzle-orm";
import { getFile, deleteFile } from "../storage";
import { createDb, images, domains } from "../db";
import { authMiddleware, verifyApiKey } from "../middleware/auth";
import { publicImageRateLimit } from "../middleware/rate-limit";
import { generateImageToken, verifyImageToken } from "../lib/tokens";
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

    const fallbackDomain = c.env.BASE_URL?.replace(/^https?:\/\//, "") || "formality.life";

    const imagesWithUrls = await Promise.all(
      userImages.map(async (img) => {
        const domain = img.domain || fallbackDomain;
        let url = `https://${domain}/i/${img.id}`;
        if (img.isPrivate) {
          const token = await generateImageToken(
            img.id,
            user.id,
            c.env.TOKEN_SECRET
          );
          url = `${url}?token=${token}`;
        }
        return {
          id: img.id,
          url,
          originalName: img.originalName,
          contentType: img.contentType,
          sizeBytes: img.sizeBytes,
          isPrivate: img.isPrivate,
          createdAt: img.createdAt,
          domain,
        };
      })
    );

    return c.json({
      images: imagesWithUrls,
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

    // Get the request hostname and validate domain access
    const requestHost = c.req.header("host")?.split(":")[0] || "";
    const [defaultDomain] = await db
      .select({ domain: domains.domain })
      .from(domains)
      .where(eq(domains.isDefault, true));
    const defaultDomainName = defaultDomain?.domain || "formality.life";

    // Non-default domains can only serve images uploaded with that specific domain
    if (requestHost !== defaultDomainName) {
      const imageDomain = image.domain || defaultDomainName;
      if (imageDomain !== requestHost) {
        return c.json({ error: "Not found" }, 404);
      }
    }

    if (image.isPrivate) {
      let authorized = false;

      // Try API key header first
      const apiKey = c.req.header("X-API-Key");
      if (apiKey) {
        const user = await verifyApiKey(db, apiKey);
        if (user && user.id === image.userId) {
          authorized = true;
        }
      }

      // Try token query parameter
      if (!authorized) {
        const token = c.req.query("token");
        if (token) {
          const result = await verifyImageToken(token, id, c.env.TOKEN_SECRET);
          if (result && result.userId === image.userId) {
            authorized = true;
          }
        }
      }

      if (!authorized) {
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
