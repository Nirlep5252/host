import { Hono } from "hono";
import { nanoid } from "nanoid";
import { uploadFile, deleteFile } from "../storage";
import { createDb, images } from "../db";
import { authMiddleware } from "../middleware/auth";
import { uploadRateLimit } from "../middleware/rate-limit";
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
    await uploadFile(c.env.R2, key, buffer, file.type);

    try {
      const db = createDb(c.env.DATABASE_URL);
      await db.insert(images).values({
        id: key,
        userId: user.id,
        originalName: file.name,
        contentType: file.type,
        sizeBytes: buffer.byteLength,
        isPrivate: false,
      });
    } catch (dbError) {
      try {
        await deleteFile(c.env.R2, key);
      } catch {}
      throw dbError;
    }

    const baseUrl = c.env.BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/i/${key}`;

    return c.json({ url, id: key });
  } catch (error) {
    console.error("Upload failed:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

export default upload;
