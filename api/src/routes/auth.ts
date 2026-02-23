import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, users } from "../db";
import { createAuth } from "../lib/auth";
import type { Bindings, Variables } from "../types";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

auth.get("/github", async (c) => {
  const callbackURL = c.req.query("callbackURL") || "/dashboard";
  const db = createDb(c.env.DATABASE_URL);
  const authInstance = createAuth(db, c.env);

  const request = new Request(`${c.env.BASE_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "github", callbackURL }),
  });

  const response = await authInstance.handler(request);

  // better-auth returns JSON with { url, redirect } — extract and redirect
  // Forward ALL Set-Cookie headers (state + cross-domain cookies)
  const data = await response.json() as { url: string; redirect: boolean };
  const redirectResponse = new Response(null, {
    status: 302,
    headers: { Location: data.url },
  });
  for (const cookie of response.headers.getSetCookie()) {
    redirectResponse.headers.append("Set-Cookie", cookie);
  }
  return redirectResponse;
});

auth.post("/check-user", async (c) => {
  const body = await c.req.json<{ email: string }>();
  const email = body.email?.toLowerCase().trim();

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const db = createDb(c.env.DATABASE_URL);

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return c.json({ exists: existingUser.length > 0 });
});

export default auth;
