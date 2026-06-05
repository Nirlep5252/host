"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAdminCreateUser } from "@/lib/api";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { modalContent, transition } from "@/lib/motion";
import { ApiKeyResultDialog } from "./admin-ui";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserDialog({ isOpen, onClose }: CreateUserDialogProps) {
  const createMutation = useAdminCreateUser();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

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

  const handleClose = () => {
    setEmail("");
    setName("");
    setCreatedKey(null);
    createMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  if (createdKey) {
    return (
      <ApiKeyResultDialog
        apiKey={createdKey}
        title="User Created"
        subtitle="Copy the API key now - it won't be shown again"
        warning="This key will only be shown once. Make sure to copy it before closing this dialog."
        onClose={handleClose}
      />
    );
  }

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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
