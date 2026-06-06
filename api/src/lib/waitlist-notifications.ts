import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { users, type Database } from "../db";
import {
  EMAIL_FROM,
  waitlistNotificationEmailHtml,
  waitlistNotificationEmailText,
} from "./emails";
import type { Bindings } from "../types";

type WaitlistSignupNotification = {
  email: string;
  name: string | null;
  reason: string | null;
  position: number;
};

type WaitlistNotificationEnv = Pick<Bindings, "FRONTEND_URL" | "RESEND_API_KEY">;

export async function notifyAdminsOfWaitlistSignup(
  db: Database,
  env: WaitlistNotificationEnv,
  signup: WaitlistSignupNotification
) {
  const adminRecipients = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true)));

  if (adminRecipients.length === 0) {
    console.warn("No active admin users found for waitlist notification");
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const adminUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/dashboard/admin`;
  const emailInput = { ...signup, adminUrl };

  const results = await Promise.allSettled(
    adminRecipients.map(async ({ email }) => {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `New waitlist signup: ${signup.email}`,
        html: waitlistNotificationEmailHtml(emailInput),
        text: waitlistNotificationEmailText(emailInput),
      });

      if (result.error) {
        throw result.error;
      }
    })
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  if (failures.length > 0) {
    console.error(
      "Failed to send waitlist notification emails:",
      failures.map((failure) => failure.reason)
    );
  }
}
