"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button, Input } from "@/components/ui";
import * as motion from "motion/react-client";

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
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
      await login(apiKey);
      router.push("/dashboard");
    } catch {
      setError("Invalid API key. Please check and try again.");
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
          <p className="mt-4 text-text-secondary">
            Enter your API key to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              label="API Key"
              type="password"
              placeholder="sk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
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
            disabled={!apiKey || isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an API key?{" "}
          <Link href="/waitlist" className="text-accent hover:underline">
            Join the waitlist
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
