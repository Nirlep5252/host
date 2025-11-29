import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import upload from "./routes/upload";
import imagesRoute from "./routes/images";
import admin from "./routes/admin";
import me from "./routes/me";
import waitlistRoute from "./routes/waitlist";

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

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Image upload API" });
});

app.route("/upload", upload);
app.route("/i", imagesRoute);
app.route("/images", imagesRoute);
app.route("/admin", admin);
app.route("/me", me);
app.route("/waitlist", waitlistRoute);

export default app;
