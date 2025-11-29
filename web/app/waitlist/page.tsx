"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import Link from "next/link";
import { joinWaitlist } from "@/lib/api/waitlist";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; position: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await joinWaitlist({
        email,
        name: name || undefined,
        reason: reason || undefined,
      });
      setSuccess({ message: result.message, position: result.position });
      setEmail("");
      setName("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] bg-accent/10">
            <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
              <path d="M8 10l2.5 3L14 9l4 5H6l2-4z" fill="var(--bg-primary)" />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
            <span className="text-text-primary">formality</span>
            <span className="text-accent">.life</span>
          </span>
        </Link>

        <div className="rounded-[--radius-lg] border border-border-subtle bg-bg-secondary/50 p-6 backdrop-blur-sm">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
            Join the Waitlist
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Request access to start uploading images.
          </p>

          {success ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[--radius-md] bg-success-muted p-4">
                <p className="text-sm font-medium text-success">{success.message}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  You&apos;re #{success.position} in the queue.
                </p>
              </div>
              <p className="text-center text-sm text-text-muted">
                We&apos;ll reach out when your spot is ready.
              </p>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Name (optional)"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                label="Why do you want to join? (optional)"
                placeholder="Tell us a bit about how you plan to use formality.life..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />

              {error && (
                <p className="text-sm text-error">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
