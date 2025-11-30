import { Hono } from "hono";
import { eq, and, isNull, count, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createDb, images, users, domains, type User } from "../db";
import { verifyApiKey, hashApiKey } from "../middleware/auth";
import { sessionMiddleware, requireSession } from "../middleware/session";
import { CloudflareAPI } from "../lib/cloudflare";
import type { Bindings, Variables } from "../types";

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

    // Fetch domains that user can potentially use:
    // 1. Admin domains (ownerId is null) that are active
    // 2. User's own domains (regardless of visibility/approval)
    // 3. Other users' public domains that are approved and active
    const activeDomains = await db
      .select({
        id: domains.id,
        domain: domains.domain,
        isDefault: domains.isDefault,
        isWorkerDomain: domains.isWorkerDomain,
        cloudflareHostnameId: domains.cloudflareHostnameId,
        ownerId: domains.ownerId,
        visibility: domains.visibility,
        isApproved: domains.isApproved,
      })
      .from(domains)
      .where(
        and(
          eq(domains.isActive, true),
          or(
            isNull(domains.ownerId),
            eq(domains.ownerId, user.id),
            and(
              eq(domains.visibility, "public"),
              eq(domains.isApproved, true)
            )
          )
        )
      );

    // Filter to only fully configured domains (or user's own unconfigured domains for status display)
    const configuredDomains = await Promise.all(
      activeDomains.map(async (domain) => {
        const isOwner = domain.ownerId === user.id;

        // Default domains and worker domains don't need Cloudflare for SaaS verification
        if (domain.isDefault || domain.isWorkerDomain) {
          return {
            id: domain.id,
            domain: domain.domain,
            isDefault: domain.isDefault,
            isOwner,
            visibility: domain.visibility,
            isApproved: domain.isApproved,
            isConfigured: true,
            status: "active",
            sslStatus: "active",
          };
        }

        // Custom domains need to be checked in Cloudflare
        if (!domain.cloudflareHostnameId) {
          // Only include unconfigured domains if user owns them (so they can see status)
          if (isOwner) {
            return {
              id: domain.id,
              domain: domain.domain,
              isDefault: domain.isDefault,
              isOwner,
              visibility: domain.visibility,
              isApproved: domain.isApproved,
              isConfigured: false,
              status: "pending",
              sslStatus: "pending",
            };
          }
          return null;
        }

        const status = await cf.checkHostnameStatus(domain.domain);

        // Include domain if it's configured OR if user owns it (so they can see pending status)
        if (status.isConfigured || isOwner) {
          return {
            id: domain.id,
            domain: domain.domain,
            isDefault: domain.isDefault,
            isOwner,
            visibility: domain.visibility,
            isApproved: domain.isApproved,
            isConfigured: status.isConfigured,
            status: status.status,
            sslStatus: status.sslStatus,
          };
        }

        return null;
      })
    );

    // Filter out null values
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

      // Check if user can use this domain:
      // 1. Admin domain (ownerId is null)
      // 2. User's own domain
      // 3. Public + approved domain from another user
      const isAdminDomain = domain.ownerId === null;
      const isOwnDomain = domain.ownerId === sessionUser.id;
      const isPublicApproved = domain.visibility === "public" && domain.isApproved;

      if (!isAdminDomain && !isOwnDomain && !isPublicApproved) {
        return c.json({ error: "You don't have access to this domain" }, 403);
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

me.post("/domains", requireSession, async (c) => {
  const sessionUser = c.get("sessionUser");
  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN, c.env.CLOUDFLARE_WORKER_NAME);
    const body = await c.req.json<{ domain: string; visibility: "private" | "public" }>();

    if (!body.domain || typeof body.domain !== "string") {
      return c.json({ error: "Domain is required" }, 400);
    }

    if (!body.visibility || !["private", "public"].includes(body.visibility)) {
      return c.json({ error: "Visibility must be 'private' or 'public'" }, 400);
    }

    // Validate domain format
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    const cleanDomain = body.domain.toLowerCase().trim();
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
