import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { Bindings } from "../types";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
    lastCleanup = now;
  }
}

function getRateLimitKey(c: Context, keyType: "apiKey" | "adminKey" | "ip"): string | null {
  switch (keyType) {
    case "apiKey": {
      const apiKey = c.req.header("X-API-Key");
      return apiKey ? `api:${apiKey}` : null;
    }
    case "adminKey": {
      const adminKey = c.req.header("X-Admin-Key");
      return adminKey ? `admin:${adminKey}` : null;
    }
    case "ip": {
      const ip = c.req.header("CF-Connecting-IP") ||
                 c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
                 "unknown";
      return `ip:${ip}`;
    }
  }
}

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

export function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  keyType: "apiKey" | "adminKey" | "ip" = "ip"
) {
  return createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
    const key = getRateLimitKey(c, keyType);

    if (!key) {
      return c.json({ error: "Unable to determine rate limit key" }, 400);
    }

    const { allowed, remaining, resetTime } = checkRateLimit(key, maxRequests, windowMs);

    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      c.header("Retry-After", retryAfter.toString());
      return c.json(
        {
          error: "Rate limit exceeded",
          retryAfter,
        },
        429
      );
    }

    await next();
  });
}

export const uploadRateLimit = createRateLimiter(30, 60000, "apiKey");
export const adminRateLimit = createRateLimiter(10, 60000, "adminKey");
export const publicImageRateLimit = createRateLimiter(100, 60000, "ip");
export const waitlistRateLimit = createRateLimiter(10, 3600000, "ip"); // 10 per hour
