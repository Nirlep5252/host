import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import type { Database } from "../db";
import * as schema from "../db/schema";
import type { Bindings } from "../types";

export function createAuth(db: Database, env: Bindings) {
  const resend = new Resend(env.RESEND_API_KEY);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: false,
      schema: {
        user: schema.users,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BASE_URL,
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "https://web.formality.life"],
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const existingUser = await db
            .select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .limit(1);

          if (existingUser.length === 0) {
            return;
          }

          await resend.emails.send({
            from: "formality.life <noreply@formality.life>",
            to: email,
            subject: "Sign in to formality.life",
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #fafafa;">
                  Sign in to <span style="color: #D946EF;">formality.life</span>
                </h1>
                <p style="color: #a1a1aa; margin-bottom: 24px;">
                  Click the button below to sign in to your account. This link will expire in 10 minutes.
                </p>
                <a href="${url}" style="display: inline-block; background: #D946EF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Sign in
                </a>
                <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>
            `,
          });
        },
        expiresIn: 600,
        disableSignUp: true,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
