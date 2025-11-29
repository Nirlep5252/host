import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import upload from "./routes/upload";
import imagesRoute from "./routes/images";
import admin from "./routes/admin";
import me from "./routes/me";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Image upload API" });
});

app.route("/upload", upload);
app.route("/i", imagesRoute);
app.route("/images", imagesRoute);
app.route("/admin", admin);
app.route("/me", me);

export default app;
