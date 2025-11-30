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
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto;">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="font-size: 28px; font-weight: 600; color: #fafafa; margin: 0;">
                      Sign in to <span style="color: #D946EF;">formality.life</span>
                    </h1>
                  </div>

                  <div style="background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px; padding: 32px;">
                    <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      Click the button below to sign in to your account. This link will expire in 10 minutes.
                    </p>

                    <div style="text-align: center;">
                      <a href="${url}" style="display: inline-block; background: #D946EF; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                        Sign In
                      </a>
                    </div>
                  </div>

                  <div style="text-align: center; margin-top: 32px;">
                    <p style="color: #525252; font-size: 13px; margin: 0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </div>
                </div>
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
