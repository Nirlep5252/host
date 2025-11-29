import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, users, waitlist } from "../db";
import { adminMiddleware, hashApiKey } from "../middleware/auth";
import { adminRateLimit } from "../middleware/rate-limit";
import type { Bindings } from "../types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const admin = new Hono<{ Bindings: Bindings }>();

admin.use("/*", adminRateLimit);
admin.use("/*", adminMiddleware);

admin.post("/users", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ email: string; name?: string }>();

    if (!body.email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email));

    if (existing) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    const apiKey = `sk_${nanoid(32)}`;
    const apiKeyHash = await hashApiKey(apiKey);

    const result = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        apiKeyHash,
      })
      .returning();

    const newUser = result[0];

    return c.json({
      user: {
        id: newUser!.id,
        email: newUser!.email,
        name: newUser!.name,
        createdAt: newUser!.createdAt,
      },
      apiKey,
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

admin.get("/users", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users);

    return c.json({ users: allUsers });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

admin.delete("/users/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    await db.update(users).set({ isActive: false }).where(eq(users.id, id));

    return c.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

admin.post("/users/:id/regenerate-key", async (c) => {
  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const apiKey = `sk_${nanoid(32)}`;
    const apiKeyHash = await hashApiKey(apiKey);

    await db.update(users).set({ apiKeyHash }).where(eq(users.id, id));

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      apiKey,
    });
  } catch (error) {
    console.error("Failed to regenerate API key:", error);
    return c.json({ error: "Failed to regenerate API key" }, 500);
  }
});

admin.get("/waitlist", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const status = c.req.query("status");

    const VALID_STATUSES = ["pending", "approved", "rejected"];
    if (status && !VALID_STATUSES.includes(status)) {
      return c.json({ error: "Invalid status parameter. Must be: pending, approved, or rejected" }, 400);
    }

    let query = db
      .select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));

    const entries = status
      ? await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.status, status))
          .orderBy(desc(waitlist.createdAt))
      : await query;

    const pendingResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlist)
      .where(eq(waitlist.status, "pending"));

    const approvedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlist)
      .where(eq(waitlist.status, "approved"));

    const rejectedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlist)
      .where(eq(waitlist.status, "rejected"));

    return c.json({
      entries,
      stats: {
        pending: pendingResult[0]?.count ?? 0,
        approved: approvedResult[0]?.count ?? 0,
        rejected: rejectedResult[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch waitlist:", error);
    return c.json({ error: "Failed to fetch waitlist" }, 500);
  }
});

admin.post("/waitlist/:id/approve", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.id, id));

    if (!entry) {
      return c.json({ error: "Waitlist entry not found" }, 404);
    }

    if (entry.status !== "pending") {
      return c.json({ error: "Entry has already been processed" }, 400);
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, entry.email));

    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    const apiKey = `sk_${nanoid(32)}`;
    const apiKeyHash = await hashApiKey(apiKey);

    const result = await db
      .insert(users)
      .values({
        email: entry.email,
        name: entry.name,
        apiKeyHash,
      })
      .returning();

    const newUser = result[0];

    await db
      .update(waitlist)
      .set({
        status: "approved",
        processedAt: new Date(),
      })
      .where(eq(waitlist.id, id));

    return c.json({
      user: {
        id: newUser!.id,
        email: newUser!.email,
        name: newUser!.name,
        createdAt: newUser!.createdAt,
      },
      apiKey,
    });
  } catch (error) {
    console.error("Failed to approve waitlist entry:", error);
    return c.json({ error: "Failed to approve waitlist entry" }, 500);
  }
});

admin.post("/waitlist/:id/reject", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.id, id));

    if (!entry) {
      return c.json({ error: "Waitlist entry not found" }, 404);
    }

    if (entry.status !== "pending") {
      return c.json({ error: "Entry has already been processed" }, 400);
    }

    await db
      .update(waitlist)
      .set({
        status: "rejected",
        processedAt: new Date(),
      })
      .where(eq(waitlist.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to reject waitlist entry:", error);
    return c.json({ error: "Failed to reject waitlist entry" }, 500);
  }
});

admin.delete("/waitlist/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.id, id));

    if (!entry) {
      return c.json({ error: "Waitlist entry not found" }, 404);
    }

    await db.delete(waitlist).where(eq(waitlist.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete waitlist entry:", error);
    return c.json({ error: "Failed to delete waitlist entry" }, 500);
  }
});

export default admin;
