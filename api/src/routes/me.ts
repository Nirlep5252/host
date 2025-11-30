import { Hono } from "hono";
import { eq, and, isNull, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, images, users, domains, type User } from "../db";
import { verifyApiKey, hashApiKey } from "../middleware/auth";
import { sessionMiddleware, requireSession } from "../middleware/session";
import { CloudflareAPI } from "../lib/cloudflare";
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
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);

    const activeDomains = await db
      .select({
        id: domains.id,
        domain: domains.domain,
        isDefault: domains.isDefault,
        isWorkerDomain: domains.isWorkerDomain,
        cloudflareHostnameId: domains.cloudflareHostnameId,
      })
      .from(domains)
      .where(eq(domains.isActive, true));

    // Filter to only fully configured domains
    const configuredDomains = await Promise.all(
      activeDomains.map(async (domain) => {
        // Default domains and worker domains don't need Cloudflare for SaaS verification
        if (domain.isDefault || domain.isWorkerDomain) {
          return { id: domain.id, domain: domain.domain, isDefault: domain.isDefault };
        }

        // Custom domains need to be fully active in Cloudflare
        if (!domain.cloudflareHostnameId) {
          return null;
        }

        const status = await cf.checkHostnameStatus(domain.domain);
        if (status.isConfigured) {
          return { id: domain.id, domain: domain.domain, isDefault: domain.isDefault };
        }

        return null;
      })
    );

    // Filter out null values (unconfigured domains)
    const availableDomains = configuredDomains.filter((d): d is NonNullable<typeof d> => d !== null);

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
      const [domain] = await db
        .select()
        .from(domains)
        .where(and(eq(domains.id, body.domainId), eq(domains.isActive, true)));

      if (!domain) {
        return c.json({ error: "Domain not found or inactive" }, 400);
      }

      // Verify domain is fully configured (default domains and worker domains skip this check)
      if (!domain.isDefault && !domain.isWorkerDomain) {
        if (!domain.cloudflareHostnameId) {
          return c.json({ error: "Domain is not fully configured" }, 400);
        }

        const status = await cf.checkHostnameStatus(domain.domain);
        if (!status.isConfigured) {
          return c.json({ error: "Domain is not fully configured. Please wait for SSL certificate to be issued." }, 400);
        }
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
