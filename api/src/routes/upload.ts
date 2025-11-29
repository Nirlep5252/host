import { Hono } from "hono";
import { nanoid } from "nanoid";
import { uploadFile } from "../storage";
import { createDb, images } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { Bindings, Variables } from "../types";

const upload = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const getExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
};

upload.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const ext = getExtension(file.name);
  const id = nanoid(10);
  const key = `${id}${ext}`;

  const buffer = await file.arrayBuffer();
  await uploadFile(c.env.R2, key, buffer, file.type);

  const db = createDb(c.env.DATABASE_URL);
  await db.insert(images).values({
    id: key,
    userId: user.id,
    originalName: file.name,
    contentType: file.type,
    sizeBytes: buffer.byteLength,
    isPrivate: false,
  });

  const baseUrl = c.env.BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/i/${key}`;

  return c.json({ url, id: key });
});

export default upload;
