import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { createDb, users, waitlist, domains, images } from "../db";
import { adminMiddleware, hashApiKey } from "../middleware/auth";
import { adminRateLimit } from "../middleware/rate-limit";
import { CloudflareAPI } from "../lib/cloudflare";
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

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
        imageCount: sql<number>`COUNT(CASE WHEN ${images.deletedAt} IS NULL THEN 1 END)::int`,
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

    try {
      const resend = new Resend(c.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "formality.life <noreply@formality.life>",
        to: entry.email,
        subject: "Welcome to formality.life - You're In!",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 600; color: #fafafa; margin: 0;">
                  Welcome to <span style="color: #D946EF;">formality.life</span>
                </h1>
              </div>

              <div style="background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px; padding: 32px;">
                <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  Your application has been approved! You now have access to formality.life's image hosting platform.
                </p>

                <p style="color: #fafafa; font-size: 14px; font-weight: 500; margin: 0 0 12px 0;">
                  Your API Key
                </p>

                <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <code style="color: #D946EF; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 14px; word-break: break-all; letter-spacing: 0.5px;">
                    ${apiKey}
                  </code>
                </div>

                <div style="background: rgba(217, 70, 239, 0.08); border-left: 3px solid #D946EF; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                  <p style="color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.5;">
                    <strong style="color: #fafafa;">Important:</strong> Save this key securely. It won't be shown again and is required to upload images.
                  </p>
                </div>

                <div style="text-align: center;">
                  <a href="https://formality.life/" style="display: inline-block; background: #D946EF; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Get Started
                  </a>
                </div>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <p style="color: #525252; font-size: 13px; margin: 0;">
                  Need help getting started? Check out our <a href="https://formality.life/docs" style="color: #D946EF; text-decoration: none;">documentation</a>.
                </p>
              </div>
            </div>
          </div>
        `,
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

admin.get("/domains", async (c) => {
  try {
    const db = createDb(c.env.DATABASE_URL);
    const cf = new CloudflareAPI(c.env.CLOUDFLARE_ZONE_ID, c.env.CLOUDFLARE_API_TOKEN);

    const allDomains = await db.select().from(domains).orderBy(desc(domains.createdAt));

    const domainsWithStatus = await Promise.all(
      allDomains.map(async (domain) => {
        if (domain.isDefault || domain.isWorkerDomain) {
          return { ...domain, isConfigured: true, status: "active", sslStatus: "active" };
        }

        if (!domain.cloudflareHostnameId) {
          return { ...domain, isConfigured: false, status: "not_registered", sslStatus: "not_registered" };
        }

        const status = await cf.checkHostnameStatus(domain.domain);
        return {
          ...domain,
          isConfigured: status.isConfigured,
          status: status.status,
          sslStatus: status.sslStatus,
        };
      })
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

    const domainName = body.domain.toLowerCase().trim();

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
    const body = await c.req.json<{ isActive?: boolean; isDefault?: boolean }>();

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
