"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Input } from "@/components/ui";
import * as motion from "motion/react-client";
import { modalContent, transition } from "@/lib/motion";

interface AdminTokenDialogProps {
  onSuccess?: () => void;
}

export function AdminTokenDialog({ onSuccess }: AdminTokenDialogProps) {
  const { setAdminKey } = useAuth();
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await setAdminKey(adminKeyInput.trim());
      onSuccess?.();
    } catch {
      setError("Invalid admin key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
      <motion.div
        initial={modalContent.initial}
        animate={modalContent.animate}
        transition={transition.normal}
        className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-primary">
              Admin Access
            </h2>
            <p className="text-sm text-text-muted">Enter your admin key to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            placeholder="Enter admin key"
            autoFocus
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !adminKeyInput.trim()}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Verifying...
              </span>
            ) : (
              "Access Admin Panel"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
