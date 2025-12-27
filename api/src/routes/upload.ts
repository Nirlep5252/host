import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, sql, isNull } from "drizzle-orm";
import { uploadFile, deleteFile } from "../storage";
import { createDb, images, domains, users } from "../db";
import { authMiddleware } from "../middleware/auth";
import { uploadRateLimit } from "../middleware/rate-limit";
import { getEffectiveStorageLimit } from "../lib/storage";
import type { Bindings, Variables } from "../types";

const upload = new Hono<{ Bindings: Bindings; Variables: Variables }>();

upload.use("/*", uploadRateLimit);

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml", // WARNING: SVG files can contain XSS payloads. Consider sanitization if enabling.
] as const;

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
};

const validateFile = (file: File): { valid: true } | { valid: false; error: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  const ext = getExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as any)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  const mimeToExtMap: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg"],
  };

  const expectedExts = mimeToExtMap[file.type];
  if (expectedExts && !expectedExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} does not match MIME type ${file.type}`,
    };
  }

  return { valid: true };
};

upload.post("/", authMiddleware, async (c) => {
  const user = c.get("user");

  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const ext = getExtension(file.name);
    const id = nanoid(10);
    const key = `${id}${ext}`;

    const buffer = await file.arrayBuffer();

    const db = createDb(c.env.DATABASE_URL);

    const [storageResult] = await db
      .select({
        currentUsage: sql<string>`COALESCE(SUM(CASE WHEN ${images.deletedAt} IS NULL THEN ${images.sizeBytes} END), 0)::bigint`,
      })
      .from(images)
      .where(eq(images.userId, user.id));

    const [userRecord] = await db
      .select({ storageLimitBytes: users.storageLimitBytes })
      .from(users)
      .where(eq(users.id, user.id));

    const currentUsage = Number(storageResult?.currentUsage || 0);
    const storageLimit = getEffectiveStorageLimit(
      userRecord?.storageLimitBytes ?? null
    );

    if (currentUsage + buffer.byteLength > storageLimit) {
      return c.json(
        {
          error: "Storage limit exceeded",
          currentUsage,
          storageLimit,
          fileSize: buffer.byteLength,
        },
        413
      );
    }

    await uploadFile(c.env.R2, key, buffer, file.type);

    let userDomain: string | null = null;
    const [freshUser] = await db
      .select({ domainId: users.domainId })
      .from(users)
      .where(eq(users.id, user.id));

    if (freshUser?.domainId) {
      const [domainRecord] = await db
        .select({ domain: domains.domain })
        .from(domains)
        .where(eq(domains.id, freshUser.domainId));
      userDomain = domainRecord?.domain ?? null;
    }
    if (!userDomain) {
      const [defaultDomain] = await db
        .select({ domain: domains.domain })
        .from(domains)
        .where(eq(domains.isDefault, true));
      userDomain = defaultDomain?.domain ?? null;
    }

    const imageDomain = userDomain || c.env.BASE_URL?.replace(/^https?:\/\//, "") || "formality.life";

    try {
      await db.insert(images).values({
        id: key,
        userId: user.id,
        originalName: file.name,
        contentType: file.type,
        sizeBytes: buffer.byteLength,
        isPrivate: false,
        domain: imageDomain,
      });
    } catch (dbError) {
      try {
        await deleteFile(c.env.R2, key);
      } catch {}
      throw dbError;
    }

    const url = `https://${imageDomain}/i/${key}`;

    return c.json({ url, id: key });
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

export default upload;
