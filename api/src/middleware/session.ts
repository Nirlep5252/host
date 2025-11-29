import { createMiddleware } from "hono/factory";
import { createDb, type User, type Session } from "../db";
import { createAuth } from "../lib/auth";
import type { Bindings } from "../types";

type SessionVariables = {
  session: Session | null;
  sessionUser: User | null;
};

export const sessionMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: SessionVariables;
}>(async (c, next) => {
  const db = createDb(c.env.DATABASE_URL);
  const auth = createAuth(db, c.env);

  try {
    const sessionData = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    c.set("session", (sessionData?.session as Session) || null);
    c.set("sessionUser", (sessionData?.user as User) || null);
  } catch {
    c.set("session", null);
    c.set("sessionUser", null);
  }

  await next();
});

export const requireSession = createMiddleware<{
  Bindings: Bindings;
  Variables: SessionVariables;
}>(async (c, next) => {
  const sessionUser = c.get("sessionUser");

  if (!sessionUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
