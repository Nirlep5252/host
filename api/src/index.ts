import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import { createDb } from "./db";
import { createAuth } from "./lib/auth";
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
    allowHeaders: ["Content-Type", "X-API-Key", "X-Admin-Key"],
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

app.route("/upload", upload);
app.route("/i", imagesRoute);
app.route("/images", imagesRoute);
app.route("/admin", admin);
app.route("/me", me);
app.route("/waitlist", waitlistRoute);
app.route("/auth", authRoute);

export default app;
