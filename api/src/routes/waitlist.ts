import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { createDb, waitlist, users } from "../db";
import { waitlistRateLimit } from "../middleware/rate-limit";
import type { Bindings } from "../types";

const waitlistRoute = new Hono<{ Bindings: Bindings }>();

waitlistRoute.use("/*", waitlistRateLimit);

waitlistRoute.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      email: string;
      name?: string;
      reason?: string;
    }>();

    if (!body.email || typeof body.email !== "string") {
      return c.json({ error: "Email is required" }, 400);
    }

    const email = body.email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (email.length > 254) {
      return c.json({ error: "Email is too long" }, 400);
    }

    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const [localPart] = email.split("@");
    if (!localPart || localPart.length > 64) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    if (body.name !== undefined && body.name !== null) {
      if (typeof body.name !== "string") {
        return c.json({ error: "Name must be a string" }, 400);
      }
      if (body.name.length > 255) {
        return c.json({ error: "Name must be 255 characters or less" }, 400);
      }
    }

    if (body.reason !== undefined && body.reason !== null) {
      if (typeof body.reason !== "string") {
        return c.json({ error: "Reason must be a string" }, 400);
      }
      if (body.reason.length > 2000) {
        return c.json({ error: "Reason must be 2000 characters or less" }, 400);
      }
    }

    const db = createDb(c.env.DATABASE_URL);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return c.json({ error: "An account with this email already exists" }, 400);
    }

    const [existingEntry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email));

    if (existingEntry) {
      return c.json({ error: "You're already on the waitlist" }, 400);
    }

    await db.insert(waitlist).values({
      email,
      name: body.name?.trim() || null,
      reason: body.reason?.trim() || null,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlist)
      .where(eq(waitlist.status, "pending"));

    const count = countResult[0]?.count ?? 0;

    return c.json({
      success: true,
      message: "You've been added to the waitlist!",
      position: count,
    });
  } catch (error) {
    console.error("Waitlist signup failed:", error);
    return c.json({ error: "Failed to join waitlist" }, 500);
  }
});

export default waitlistRoute;
