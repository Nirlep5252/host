"use client";

import { useTemporaryFlag } from "@/lib/hooks/use-temporary-state";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui";

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-400",
  "bg-blue-500/20 text-blue-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-rose-500/20 text-rose-400",
  "bg-pink-500/20 text-pink-400",
  "bg-indigo-500/20 text-indigo-400",
];

export function getInitials(email: string, name?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return email.slice(0, 2).toUpperCase();
}

export function getAvatarColor(email: string): string {
  const index = email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function formatAdminDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

type ApiKeyResultDialogProps = {
  apiKey: string | null;
  title: string;
  subtitle: string;
  warning: string;
  onClose: () => void;
  onCopied?: (apiKey: string) => void;
};

export function ApiKeyResultDialog({
  apiKey,
  title,
  subtitle,
  warning,
  onClose,
  onCopied,
}: ApiKeyResultDialogProps) {
  const { active: copied, activate: markCopied } = useTemporaryFlag(2000);

  const handleCopyKey = async () => {
    if (!apiKey) return;

    await navigator.clipboard.writeText(apiKey);
    markCopied();
    onCopied?.(apiKey);
  };

  return (
    <AnimatePresence>
      {apiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-6 shadow-2xl"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <CheckIcon className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
                    {title}
                  </h2>
                  <p className="text-sm text-text-muted">{subtitle}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-[--radius-md] bg-bg-tertiary px-3 py-2.5 font-mono text-sm text-accent">
                    {apiKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-md] bg-bg-tertiary text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-success" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-[--radius-md] border border-warning/20 bg-warning/5 px-3 py-2.5">
                <p className="text-xs text-warning">{warning}</p>
              </div>

              <Button variant="primary" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
