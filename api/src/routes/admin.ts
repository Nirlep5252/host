import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { Resend } from "resend";
import { createDb, users, waitlist, domains, images } from "../db";
import { adminMiddleware } from "../middleware/auth";
import { adminRateLimit } from "../middleware/rate-limit";
import { CloudflareAPI } from "../lib/cloudflare";
import { createApiKeyForUser } from "../lib/api-keys";
import { normalizeDomain, resolveDomainStatus } from "../lib/domains";
import { EMAIL_FROM, welcomeEmailHtml } from "../lib/emails";
import { createUserWithApiKey, findUserByEmail } from "../lib/users";
import {
  getPendingWaitlistEntry,
  getWaitlistStats,
  isWaitlistStatus,
} from "../lib/waitlist";
import type { Bindings, Variables } from "../types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

admin.use("/*", adminRateLimit);
admin.use("/*", adminMiddleware);

admin.post("/users", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ email: string; name?: string }>();

    if (!body.email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const existing = await findUserByEmail(db, body.email);

    if (existing) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    const result = await createUserWithApiKey(db, {
      email: body.email,
      name: body.name,
      keyName: "Default",
    });

    return c.json({
      user: result.user,
      apiKey: result.apiKey,
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

admin.get("/users", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        storageLimitBytes: users.storageLimitBytes,
        imageCount: sql<number>`COUNT(CASE WHEN ${images.id} IS NOT NULL AND ${images.deletedAt} IS NULL THEN 1 END)::int`,
        storageBytes: sql<number>`COALESCE(SUM(CASE WHEN ${images.deletedAt} IS NULL THEN ${images.sizeBytes} END), 0)::bigint`,
      })
      .from(users)
      .leftJoin(images, eq(users.id, images.userId))
      .groupBy(users.id);

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

admin.post("/users/:id/create-key", async (c) => {
  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DATABASE_URL);

    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const apiKey = await createApiKeyForUser(db, user.id, "Admin-generated");

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      apiKey,
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return c.json({ error: "Failed to create API key" }, 500);
  }
});

admin.patch("/users/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{
      storageLimitBytes?: number | null;
      role?: string;
    }>();

    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (body.storageLimitBytes !== undefined) {
      if (
        body.storageLimitBytes !== null &&
        (typeof body.storageLimitBytes !== "number" || body.storageLimitBytes < 0)
      ) {
        return c.json({ error: "Invalid storage limit value" }, 400);
      }
    }

    if (
      body.role !== undefined &&
      !["user", "admin"].includes(body.role)
    ) {
      return c.json({ error: "Invalid role" }, 400);
    }

    const result = await db
      .update(users)
      .set({
        ...(body.storageLimitBytes !== undefined && {
          storageLimitBytes: body.storageLimitBytes,
        }),
        ...(body.role !== undefined && { role: body.role }),
      })
      .where(eq(users.id, id))
      .returning();

    return c.json({ user: result[0] });
  } catch (error) {
    console.error("Failed to update user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

admin.get("/waitlist", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const status = c.req.query("status");

    if (status && !isWaitlistStatus(status)) {
      return c.json({ error: "Invalid status parameter. Must be: pending, approved, or rejected" }, 400);
    }

    const entries = status
      ? await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.status, status))
          .orderBy(desc(waitlist.createdAt))
      : await db
          .select()
          .from(waitlist)
          .orderBy(desc(waitlist.createdAt));

    const stats = await getWaitlistStats(db);

    return c.json({
      entries,
      stats,
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

    const pendingEntry = await getPendingWaitlistEntry(db, id);
    if (!pendingEntry.ok) {
      return c.json({ error: pendingEntry.error }, pendingEntry.status);
    }

    const existingUser = await findUserByEmail(db, pendingEntry.entry.email);

    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 400);
    }

    const result = await createUserWithApiKey(db, {
      email: pendingEntry.entry.email,
      name: pendingEntry.entry.name,
      keyName: "Default",
    });

    try {
      const resend = new Resend(c.env.RESEND_API_KEY);
      await resend.emails.send({
        from: EMAIL_FROM,
        to: pendingEntry.entry.email,
        subject: "Welcome to formality.life - You're In!",
        html: welcomeEmailHtml(),
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    await db
      .update(waitlist)
      .set({
        status: "approved",
        processedAt: new Date(),
      })
      .where(eq(waitlist.id, id));

    return c.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        createdAt: result.user.createdAt,
      },
      apiKey: result.apiKey,
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

    const pendingEntry = await getPendingWaitlistEntry(db, id);
    if (!pendingEntry.ok) {
      return c.json({ error: pendingEntry.error }, pendingEntry.status);
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

admin.get("/domains", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);

    const allDomains = await db
      .select({
        id: domains.id,
        domain: domains.domain,
        cloudflareHostnameId: domains.cloudflareHostnameId,
        isDefault: domains.isDefault,
        isActive: domains.isActive,
        isWorkerDomain: domains.isWorkerDomain,
        createdAt: domains.createdAt,
        ownerId: domains.ownerId,
        visibility: domains.visibility,
        isApproved: domains.isApproved,
        ownerEmail: users.email,
      })
      .from(domains)
      .leftJoin(users, eq(domains.ownerId, users.id))
      .orderBy(desc(domains.createdAt));

    const domainsWithStatus = await Promise.all(
      allDomains.map(async (domain) => ({
        ...domain,
        ...(await resolveDomainStatus(domain, cf)),
      }))
    );

    return c.json({ domains: domainsWithStatus });
  } catch (error) {
    console.error("Failed to fetch domains:", error);
    return c.json({ error: "Failed to fetch domains" }, 500);
  }
});

admin.post("/domains", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);
    const body = await c.req.json<{ domain: string; isDefault?: boolean }>();

    if (!body.domain) {
      return c.json({ error: "Domain is required" }, 400);
    }

    const domainName = normalizeDomain(body.domain);

    const [existing] = await db
      .select()
      .from(domains)
      .where(eq(domains.domain, domainName));

    if (existing) {
      return c.json({ error: "Domain already exists" }, 400);
    }

    let cloudflareHostnameId: string | undefined;

    if (!body.isDefault) {
      const cfResult = await cf.createCustomHostname(domainName);
      if (!cfResult.success) {
        return c.json({ error: cfResult.error || "Failed to register domain with Cloudflare" }, 400);
      }
      cloudflareHostnameId = cfResult.hostnameId;
    }

    if (body.isDefault) {
      await db.update(domains).set({ isDefault: false }).where(eq(domains.isDefault, true));
    }

    const result = await db
      .insert(domains)
      .values({
        domain: domainName,
        cloudflareHostnameId,
        isDefault: body.isDefault ?? false,
      })
      .returning();

    return c.json({ domain: result[0] });
  } catch (error) {
    console.error("Failed to create domain:", error);
    return c.json({ error: "Failed to create domain" }, 500);
  }
});

admin.patch("/domains/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const body = await c.req.json<{ isActive?: boolean; isDefault?: boolean; isApproved?: boolean }>();

    const [domain] = await db.select().from(domains).where(eq(domains.id, id));

    if (!domain) {
      return c.json({ error: "Domain not found" }, 404);
    }

    if (body.isDefault === true) {
      await db.update(domains).set({ isDefault: false }).where(eq(domains.isDefault, true));
    }

    const result = await db
      .update(domains)
      .set({
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isApproved !== undefined && { isApproved: body.isApproved }),
      })
      .where(eq(domains.id, id))
      .returning();

    return c.json({ domain: result[0] });
  } catch (error) {
    console.error("Failed to update domain:", error);
    return c.json({ error: "Failed to update domain" }, 500);
  }
});

admin.delete("/domains/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: "Invalid ID format" }, 400);
  }

  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);

    const [domain] = await db.select().from(domains).where(eq(domains.id, id));

    if (!domain) {
      return c.json({ error: "Domain not found" }, 404);
    }

    if (domain.isDefault) {
      return c.json({ error: "Cannot delete default domain" }, 400);
    }

    const usersWithDomain = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.domainId, id))
      .limit(1);

    if (usersWithDomain.length > 0) {
      return c.json({ error: "Cannot delete domain that is assigned to users" }, 400);
    }

    if (domain.cloudflareHostnameId) {
      const cfResult = await cf.deleteCustomHostname(domain.cloudflareHostnameId);
      if (!cfResult.success) {
        console.error("Failed to delete Cloudflare hostname:", cfResult.error);
      }
    }

    await db.delete(domains).where(eq(domains.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete domain:", error);
    return c.json({ error: "Failed to delete domain" }, 500);
  }
});

export default admin;
