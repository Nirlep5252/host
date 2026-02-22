import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import { createDb } from "./db";
import { createAuth } from "./lib/auth";
import { CloudflareAPI } from "./lib/cloudflare";
import upload from "./routes/upload";
import imagesRoute from "./routes/images";
import admin from "./routes/admin";
import me from "./routes/me";
import waitlistRoute from "./routes/waitlist";
import authRoute from "./routes/auth";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://web.formality.life"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-Key", "X-Admin-Key", "User-Agent"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const auth = createAuth(db, c.env);
  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.redirect("https://web.formality.life");
});

app.get("/.well-known/acme-challenge/:token", async (c) => {
  const token = c.req.param("token");
  const hostname = c.req.header("host");

  if (!hostname) {
    return c.text("Missing host header", 400);
  }

  const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);
  const result = await cf.getCustomHostnameByName(hostname);

  if (!result.success || !result.hostname) {
    return c.text("Hostname not found", 404);
  }

  const httpValidation = result.hostname.ownership_verification_http;
  if (httpValidation?.http_url.includes(token)) {
    return c.text(httpValidation.http_body);
  }

  const sslValidationRecords = result.hostname.ssl.validation_records;
  if (sslValidationRecords) {
    for (const record of sslValidationRecords) {
      if (record.http_url?.includes(token) && record.http_body) {
        return c.text(record.http_body);
      }
    }
  }

  return c.text("Token not found", 404);
});

app.route("/upload", upload);
app.route("/i", imagesRoute);
app.route("/images", imagesRoute);
app.route("/admin", admin);
app.route("/me", me);
app.route("/waitlist", waitlistRoute);
app.route("/auth", authRoute);

export default app;
