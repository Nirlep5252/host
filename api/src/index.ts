import { Hono } from "hono";
import { nanoid } from "nanoid";
import { uploadFile, getFile, deleteFile } from "./storage";
import type { R2Bucket } from "@cloudflare/workers-types";

type Bindings = {
  R2: R2Bucket;
  API_KEY: string;
  BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const getExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
};

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Image upload API" });
});

app.post("/upload", async (c) => {
  const apiKey = c.req.header("X-API-Key");
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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

  const baseUrl = c.env.BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/i/${key}`;

  return c.json({ url, id: key });
});

app.get("/i/:id", async (c) => {
  const id = c.req.param("id");
  const result = await getFile(c.env.R2, id);

  if (!result) {
    return c.json({ error: "Not found" }, 404);
  }

  return new Response(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

app.delete("/i/:id", async (c) => {
  const apiKey = c.req.header("X-API-Key");
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const exists = await getFile(c.env.R2, id);

  if (!exists) {
    return c.json({ error: "Not found" }, 404);
  }

  await deleteFile(c.env.R2, id);
  return c.json({ success: true, id });
});

export default app;
