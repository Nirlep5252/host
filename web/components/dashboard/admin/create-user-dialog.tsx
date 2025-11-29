"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useAdminCreateUser } from "@/lib/api";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { modalContent, transition } from "@/lib/motion";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserDialog({ isOpen, onClose }: CreateUserDialogProps) {
  const { adminKey } = useAuth();
  const createMutation = useAdminCreateUser(adminKey || "");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const result = await createMutation.mutateAsync({
        email: email.trim(),
        name: name.trim() || undefined,
      });
      setCreatedKey(result.apiKey);
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setCreatedKey(null);
    setCopied(false);
    createMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
        <motion.div
          initial={modalContent.initial}
          animate={modalContent.animate}
          exit={modalContent.exit}
          transition={transition.normal}
          className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-8 shadow-2xl"
        >
          {createdKey ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-primary">
                    User Created
                  </h2>
                  <p className="text-sm text-text-muted">Copy the API key now - it won't be shown again</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-[--radius-md] bg-bg-tertiary px-4 py-3 font-mono text-sm text-accent break-all">
                    {createdKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[--radius-md] bg-bg-tertiary text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    {copied ? (
                      <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-[--radius-md] border border-warning/20 bg-warning/5 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-warning">
                    This key will only be shown once. Make sure to copy it before closing this dialog.
                  </p>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-primary">
                    Create User
                  </h2>
                  <p className="text-sm text-text-muted">Add a new user to the platform</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />

                <Input
                  label="Name (optional)"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />

                {createMutation.error && (
                  <p className="text-sm text-error">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : "Failed to create user"}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={createMutation.isPending || !email.trim()}
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Creating...
                      </span>
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
