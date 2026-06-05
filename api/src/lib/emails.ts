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
