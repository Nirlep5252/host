"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { authClient } from "@/lib/auth-client";
import { Button, Input } from "@/components/ui";
import * as motion from "motion/react-client";

type LoginStep = "email" | "sent";

const FRONTEND_URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<LoginStep>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const checkResponse = await fetch(`${FRONTEND_URL}/auth/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const { exists } = await checkResponse.json();

      if (!exists) {
        setError("No account found with this email. Join the waitlist to get access.");
        return;
      }

      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: `${FRONTEND_URL}/dashboard`,
      });

      if (error) {
        setError(error.message || "Failed to send magic link");
        return;
      }

      setStep("sent");
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: `${FRONTEND_URL}/dashboard`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-4 rounded-full bg-accent/20 blur-2xl" />
            <h1 className="font-[family-name:var(--font-display)] relative text-3xl font-bold tracking-tight">
              <span className="text-text-primary">formality</span>
              <span className="text-accent">.life</span>
            </h1>
          </div>
        </div>

        {step === "email" ? (
          <>
            <p className="mb-6 text-center text-text-secondary">
              Enter your email to sign in
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-error"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!email || isLoading}
              >
                {isLoading ? "Sending..." : "Continue with Email"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-primary px-2 text-text-muted">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => {
                window.location.href = `${FRONTEND_URL}/auth/github?callbackURL=${encodeURIComponent(`${FRONTEND_URL}/dashboard`)}`;
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </Button>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <svg
                  className="h-8 w-8 text-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-text-primary">
              Check your email
            </h2>
            <p className="mb-6 text-text-secondary">
              We sent a sign-in link to{" "}
              <span className="font-medium text-text-primary">{email}</span>
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-text-muted hover:text-accent transition-colors"
              >
                {isLoading ? "Sending..." : "Didn't receive it? Click to resend"}
              </button>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setStep("email");
                    setEmail("");
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/waitlist" className="text-accent hover:underline">
            Join the waitlist
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
