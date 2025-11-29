import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, users } from "../db";
import { adminMiddleware, hashApiKey } from "../middleware/auth";
import { adminRateLimit } from "../middleware/rate-limit";
import type { Bindings } from "../types";

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

export default admin;
