import { Hono } from "hono";
import { eq, and, isNull, count, sql } from "drizzle-orm";
import { createDb, images, users, domains, apiKeys, type User } from "../db";
import { verifyApiKey } from "../middleware/auth";
import { sessionMiddleware, requireSession } from "../middleware/session";
import { CloudflareAPI } from "../lib/cloudflare";
import { createApiKeyForUser } from "../lib/api-keys";
import {
  getAvailableDomainsForUser,
  getPreferredDomainName,
  normalizeDomain,
  validateDomainSelection,
  type DomainVisibility,
} from "../lib/domains";
import { getEffectiveStorageLimit } from "../lib/storage";
import type { Bindings, Variables } from "../types";

const MAX_API_KEYS = 10;

const MAX_USER_DOMAINS = 10;

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

    const [storageResult] = await db
      .select({
        storageBytes: sql<string>`COALESCE(SUM(CASE WHEN ${images.deletedAt} IS NULL THEN ${images.sizeBytes} END), 0)::bigint`,
      })
      .from(images)
      .where(eq(images.userId, user.id));

    const storageBytes = Number(storageResult?.storageBytes || 0);
    const storageLimitBytes = getEffectiveStorageLimit(user.storageLimitBytes);

    const domain = await getPreferredDomainName(db, user.id);

    const [keyCount] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id));

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      imageCount: stats?.count || 0,
      isAdmin: user.role === "admin",
      role: user.role,
      apiKeyCount: keyCount?.count || 0,
      domain,
      domainId: user.domainId,
      storageBytes,
      storageLimitBytes,
    });
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return c.json({ error: "Failed to fetch user info" }, 500);
  }
});

me.get("/api-keys", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, sessionUser.id))
      .orderBy(apiKeys.createdAt);

    return c.json({ keys });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return c.json({ error: "Failed to fetch API keys" }, 500);
  }
});

me.post("/api-keys", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ name: string }>();

    const name = body.name?.trim();
    if (!name || name.length === 0) {
      return c.json({ error: "Key name is required" }, 400);
    }
    if (name.length > 100) {
      return c.json({ error: "Key name must be 100 characters or less" }, 400);
    }

    // Check key limit
    const [keyCount] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(eq(apiKeys.userId, sessionUser.id));

    if ((keyCount?.count || 0) >= MAX_API_KEYS) {
      return c.json({ error: `You can have at most ${MAX_API_KEYS} API keys` }, 400);
    }

    const newKey = await createApiKeyForUser(db, sessionUser.id, name);

    return c.json({
      apiKey: newKey,
      message: "API key created successfully. Save this key - it won't be shown again.",
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return c.json({ error: "Failed to create API key" }, 500);
  }
});

me.delete("/api-keys/:id", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const keyId = c.req.param("id");
  if (!keyId) {
    return c.json({ error: "Key ID is required" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);

    // Verify ownership
    const [key] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, sessionUser.id)));

    if (!key) {
      return c.json({ error: "API key not found" }, 404);
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return c.json({ error: "Failed to delete API key" }, 500);
  }
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
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);

    const availableDomains = await getAvailableDomainsForUser(db, cf, user.id);

    return c.json({ domains: availableDomains });
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
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);
    const body = await c.req.json<{ domainId: string | null }>();

    if (body.domainId !== null) {
      const validation = await validateDomainSelection(
        db,
        cf,
        sessionUser.id,
        body.domainId
      );
      if (!validation.ok) {
        return c.json({ error: validation.error }, validation.status);
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

me.post("/domains", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN, c.env.CLOUDFLARE_WORKER_NAME);
    const body = await c.req.json<{
      domain: string;
      visibility: DomainVisibility;
    }>();

    if (!body.domain || typeof body.domain !== "string") {
      return c.json({ error: "Domain is required" }, 400);
    }

    if (!body.visibility || !["private", "public"].includes(body.visibility)) {
      return c.json({ error: "Visibility must be 'private' or 'public'" }, 400);
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    const cleanDomain = normalizeDomain(body.domain);
    if (!domainRegex.test(cleanDomain)) {
      return c.json({ error: "Invalid domain format" }, 400);
    }

    // Check if user has reached domain limit
    const [userDomainCount] = await db
      .select({ count: count() })
      .from(domains)
      .where(eq(domains.ownerId, sessionUser.id));

    if ((userDomainCount?.count || 0) >= MAX_USER_DOMAINS) {
      return c.json({ error: `You can only have up to ${MAX_USER_DOMAINS} custom domains` }, 400);
    }

    // Check if domain already exists
    const [existingDomain] = await db
      .select()
      .from(domains)
      .where(eq(domains.domain, cleanDomain));

    if (existingDomain) {
      return c.json({ error: "This domain is already registered" }, 400);
    }

    // Create custom hostname in Cloudflare
    const cfResult = await cf.createCustomHostname(cleanDomain);
    if (!cfResult.success) {
      return c.json({ error: cfResult.error || "Failed to register domain with Cloudflare" }, 500);
    }

    // Create worker route for the domain
    const routeResult = await cf.createWorkerRoute(cleanDomain);
    if (!routeResult.success) {
      // Rollback: delete the custom hostname we just created
      if (cfResult.hostnameId) {
        await cf.deleteCustomHostname(cfResult.hostnameId);
      }
      return c.json({ error: routeResult.error || "Failed to create worker route" }, 500);
    }

    // Insert domain into database
    const result = await db
      .insert(domains)
      .values({
        domain: cleanDomain,
        cloudflareHostnameId: cfResult.hostnameId,
        isDefault: false,
        isActive: true,
        isWorkerDomain: false,
        ownerId: sessionUser.id,
        visibility: body.visibility,
        isApproved: false,
      })
      .returning();

    const newDomain = result[0];
    if (!newDomain) {
      return c.json({ error: "Failed to create domain" }, 500);
    }

    return c.json({
      success: true,
      domain: {
        id: newDomain.id,
        domain: newDomain.domain,
        visibility: newDomain.visibility,
        isApproved: newDomain.isApproved,
        status: cfResult.status,
        sslStatus: cfResult.sslStatus,
      },
    });
  } catch (error) {
    console.error("Failed to create domain:", error);
    return c.json({ error: "Failed to create domain" }, 500);
  }
});

me.delete("/domains/:id", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const domainId = c.req.param("id");
  if (!domainId) {
    return c.json({ error: "Domain ID is required" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN, c.env.CLOUDFLARE_WORKER_NAME);

    // Find the domain and verify ownership
    const [domain] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, domainId));

    if (!domain) {
      return c.json({ error: "Domain not found" }, 404);
    }

    if (domain.ownerId !== sessionUser.id) {
      return c.json({ error: "You can only delete your own domains" }, 403);
    }

    // Reset domainId for any users who have this domain selected
    await db
      .update(users)
      .set({ domainId: null })
      .where(eq(users.domainId, domainId));

    // Delete worker route for this domain
    const routeResult = await cf.getWorkerRouteByPattern(domain.domain);
    if (routeResult.success && routeResult.routeId) {
      const deleteRouteResult = await cf.deleteWorkerRoute(routeResult.routeId);
      if (!deleteRouteResult.success) {
        console.error("Failed to delete worker route:", deleteRouteResult.error);
      }
    }

    // Delete from Cloudflare if it has a hostname ID
    if (domain.cloudflareHostnameId) {
      const cfResult = await cf.deleteCustomHostname(domain.cloudflareHostnameId);
      if (!cfResult.success) {
        console.error("Failed to delete domain from Cloudflare:", cfResult.error);
      }
    }

    // Delete from database
    await db.delete(domains).where(eq(domains.id, domainId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete domain:", error);
    return c.json({ error: "Failed to delete domain" }, 500);
  }
});

export default me;
