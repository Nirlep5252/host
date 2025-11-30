import { Hono } from "hono";
import { eq, and, isNull, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, images, users, domains, type User } from "../db";
import { verifyApiKey, hashApiKey } from "../middleware/auth";
import { sessionMiddleware, requireSession } from "../middleware/session";
import type { Bindings, Variables } from "../types";

const me = new Hono<{ Bindings: Bindings; Variables: Variables }>();

me.use("/*", sessionMiddleware);

me.get("/", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  let userId: string | null = null;

  const sessionUser = c.get("sessionUser");
  if (sessionUser) {
    userId = sessionUser.id;
  } else {
    const apiKey = c.req.header("X-API-Key");
    if (apiKey) {
      const apiUser = await verifyApiKey(db, apiKey);
      userId = apiUser?.id ?? null;
    }
  }

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // Fetch fresh user data from database to get latest domainId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const [stats] = await db
      .select({ count: count() })
      .from(images)
      .where(and(eq(images.userId, user.id), isNull(images.deletedAt)));

    let domain: string | null = null;
    if (user.domainId) {
      const [userDomain] = await db
        .select({ domain: domains.domain })
        .from(domains)
        .where(eq(domains.id, user.domainId));
      domain = userDomain?.domain ?? null;
    }
    if (!domain) {
      const [defaultDomain] = await db
        .select({ domain: domains.domain })
        .from(domains)
        .where(eq(domains.isDefault, true));
      domain = defaultDomain?.domain ?? null;
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      imageCount: stats?.count || 0,
      isAdmin: user.email === c.env.ADMIN_EMAIL,
      hasApiKey: !!user.apiKeyHash,
      domain,
      domainId: user.domainId,
    });
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return c.json({ error: "Failed to fetch user info" }, 500);
  }
});

me.post("/regenerate-key", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const newKey = `sk_${nanoid(32)}`;
    const hash = await hashApiKey(newKey);

    await db
      .update(users)
      .set({ apiKeyHash: hash })
      .where(eq(users.id, sessionUser.id));

    return c.json({
      apiKey: newKey,
      message: "API key regenerated successfully. Save this key - it won't be shown again.",
    });
  } catch (error) {
    console.error("Failed to regenerate API key:", error);
    return c.json({ error: "Failed to regenerate API key" }, 500);
  }
});

me.get("/api-key", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    hasApiKey: !!sessionUser.apiKeyHash,
  });
});

me.get("/domains", async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  let user: User | null = null;

  const sessionUser = c.get("sessionUser");
  if (sessionUser) {
    user = sessionUser;
  } else {
    const apiKey = c.req.header("X-API-Key");
    if (apiKey) {
      user = await verifyApiKey(db, apiKey);
    }
  }

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const activeDomains = await db
      .select({
        id: domains.id,
        domain: domains.domain,
        isDefault: domains.isDefault,
      })
      .from(domains)
      .where(eq(domains.isActive, true));

    return c.json({ domains: activeDomains });
  } catch (error) {
    console.error("Failed to fetch domains:", error);
    return c.json({ error: "Failed to fetch domains" }, 500);
  }
});

me.patch("/domain", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ domainId: string | null }>();

    if (body.domainId !== null) {
      const [domain] = await db
        .select()
        .from(domains)
        .where(and(eq(domains.id, body.domainId), eq(domains.isActive, true)));

      if (!domain) {
        return c.json({ error: "Domain not found or inactive" }, 400);
      }
    }

    await db
      .update(users)
      .set({ domainId: body.domainId })
      .where(eq(users.id, sessionUser.id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to update domain:", error);
    return c.json({ error: "Failed to update domain" }, 500);
  }
});

export default me;
