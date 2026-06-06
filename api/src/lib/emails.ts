export const EMAIL_FROM = "formality.life <noreply@formality.life>";

export function welcomeEmailHtml(): string {
  return `
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

          <div style="background: rgba(217, 70, 239, 0.08); border-left: 3px solid #D946EF; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong style="color: #fafafa;">First step:</strong> After signing in, create an API key from your dashboard settings to start uploading images.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="https://formality.life/" style="display: inline-block; background: #D946EF; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Sign In
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
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type WaitlistNotificationEmailInput = {
  email: string;
  name: string | null;
  reason: string | null;
  position: number;
  adminUrl: string;
};

export function waitlistNotificationEmailHtml(
  input: WaitlistNotificationEmailInput
): string {
  const name = input.name?.trim() || "Not provided";
  const reason = input.reason?.trim() || "Not provided";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 600; color: #fafafa; margin: 0;">
            New waitlist signup
          </h1>
          <p style="color: #a1a1aa; font-size: 14px; margin: 12px 0 0 0;">
            Someone just joined <span style="color: #D946EF;">formality.life</span>.
          </p>
        </div>

        <div style="background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px; padding: 32px;">
          <div style="margin-bottom: 20px;">
            <p style="color: #71717a; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px 0;">Email</p>
            <p style="color: #fafafa; font-size: 16px; margin: 0;">${escapeHtml(input.email)}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="color: #71717a; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px 0;">Name</p>
            <p style="color: #fafafa; font-size: 16px; margin: 0;">${escapeHtml(name)}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="color: #71717a; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px 0;">Reason</p>
            <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(reason)}</p>
          </div>

          <div style="background: rgba(217, 70, 239, 0.08); border-left: 3px solid #D946EF; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p style="color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong style="color: #fafafa;">Queue position:</strong> #${input.position}
            </p>
          </div>

          <div style="text-align: center;">
            <a href="${escapeHtml(input.adminUrl)}" style="display: inline-block; background: #D946EF; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Review waitlist
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function waitlistNotificationEmailText(
  input: WaitlistNotificationEmailInput
): string {
  return [
    "New waitlist signup",
    "",
    `Email: ${input.email}`,
    `Name: ${input.name?.trim() || "Not provided"}`,
    `Reason: ${input.reason?.trim() || "Not provided"}`,
    `Queue position: #${input.position}`,
    "",
    `Review waitlist: ${input.adminUrl}`,
  ].join("\n");
}
