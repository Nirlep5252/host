"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useAdminApproveWaitlist,
  useAdminRejectWaitlist,
  useAdminDeleteWaitlist,
} from "@/lib/api";
import type { WaitlistEntry } from "@/lib/api";
import { Button } from "@/components/ui";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

interface WaitlistTableProps {
  entries: WaitlistEntry[];
  onCopyKey?: (key: string) => void;
}

type ActionState = {
  type: "approve" | "reject" | "delete" | "key-result";
  entryId: string;
  key?: string;
  user?: { email: string; name: string | null };
};

function getAvatarColor(email: string): string {
  const colors = [
    "bg-violet-500/20 text-violet-400",
    "bg-blue-500/20 text-blue-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-pink-500/20 text-pink-400",
    "bg-indigo-500/20 text-indigo-400",
  ];
  const index = email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function getInitials(email: string, name?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
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

export function WaitlistTable({ entries, onCopyKey }: WaitlistTableProps) {
  const { adminKey } = useAuth();
  const approveMutation = useAdminApproveWaitlist(adminKey || "");
  const rejectMutation = useAdminRejectWaitlist(adminKey || "");
  const deleteMutation = useAdminDeleteWaitlist(adminKey || "");
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [copied, setCopied] = useState(false);

  const handleApprove = async (entry: WaitlistEntry) => {
    if (actionState?.type === "approve" && actionState.entryId === entry.id) {
      const result = await approveMutation.mutateAsync(entry.id);
      setActionState({
        type: "key-result",
        entryId: entry.id,
        key: result.apiKey,
        user: { email: result.user.email, name: result.user.name },
      });
    } else {
      setActionState({ type: "approve", entryId: entry.id });
      setTimeout(() => {
        setActionState((current) =>
          current?.type === "approve" && current.entryId === entry.id
            ? null
            : current
        );
      }, 3000);
    }
  };

  const handleReject = async (entryId: string) => {
    if (actionState?.type === "reject" && actionState.entryId === entryId) {
      await rejectMutation.mutateAsync(entryId);
      setActionState(null);
    } else {
      setActionState({ type: "reject", entryId });
      setTimeout(() => {
        setActionState((current) =>
          current?.type === "reject" && current.entryId === entryId
            ? null
            : current
        );
      }, 3000);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (actionState?.type === "delete" && actionState.entryId === entryId) {
      await deleteMutation.mutateAsync(entryId);
      setActionState(null);
    } else {
      setActionState({ type: "delete", entryId });
      setTimeout(() => {
        setActionState((current) =>
          current?.type === "delete" && current.entryId === entryId
            ? null
            : current
        );
      }, 3000);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    onCopyKey?.(key);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeKeyResult = () => {
    setActionState(null);
    setCopied(false);
  };

  const getStatusBadge = (status: WaitlistEntry["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
            <span className="h-1.5 w-1.5 rounded-full bg-error" />
            Rejected
          </span>
        );
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group relative rounded-[--radius-lg] border p-4 transition-all duration-200 ${
              entry.status === "pending"
                ? "border-border-default bg-bg-secondary hover:border-border-subtle hover:bg-bg-hover"
                : "border-border-subtle bg-bg-tertiary/30"
            }`}
          >
            {/* Header: Avatar + Status + Position */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(entry.email)}`}
                >
                  {getInitials(entry.email, entry.name)}
                </div>
                {entry.status === "pending" && (
                  <span className="rounded-[--radius-sm] bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                    #{index + 1}
                  </span>
                )}
              </div>
              {getStatusBadge(entry.status)}
            </div>

            {/* Entry Info */}
            <div className="mb-2">
              <p
                className={`truncate font-medium ${entry.status === "pending" ? "text-text-primary" : "text-text-secondary"}`}
              >
                {entry.name || entry.email.split("@")[0]}
              </p>
              <p className="mt-0.5 truncate text-sm text-text-muted">
                {entry.email}
              </p>
            </div>

            {/* Reason (if provided) */}
            {entry.reason && (
              <p className="mb-3 line-clamp-2 text-xs text-text-muted italic">
                &ldquo;{entry.reason}&rdquo;
              </p>
            )}

            {/* Footer: Date + Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {formatDate(entry.createdAt)}
              </span>

              {entry.status === "pending" && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {actionState?.type === "approve" &&
                  actionState.entryId === entry.id ? (
                    <button
                      onClick={() => handleApprove(entry)}
                      disabled={approveMutation.isPending}
                      className="rounded-[--radius-sm] bg-success/10 px-2 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? "..." : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(entry)}
                      className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-success/10 hover:text-success"
                      title="Approve"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                  )}

                  {actionState?.type === "reject" &&
                  actionState.entryId === entry.id ? (
                    <button
                      onClick={() => handleReject(entry.id)}
                      disabled={rejectMutation.isPending}
                      className="rounded-[--radius-sm] bg-error/10 px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? "..." : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(entry.id)}
                      className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      title="Reject"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {entry.status !== "pending" && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {actionState?.type === "delete" &&
                  actionState.entryId === entry.id ? (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-[--radius-sm] bg-error/10 px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "..." : "Delete"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      title="Delete"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Result Modal */}
      <AnimatePresence>
        {actionState?.type === "key-result" && actionState.key && (
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
                    <svg
                      className="h-5 w-5 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
                      User Created
                    </h2>
                    <p className="text-sm text-text-muted">
                      {actionState.user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded-[--radius-md] bg-bg-tertiary px-3 py-2.5 font-mono text-sm text-accent">
                      {actionState.key}
                    </code>
                    <button
                      onClick={() => handleCopyKey(actionState.key!)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-md] bg-bg-tertiary text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                    >
                      {copied ? (
                        <svg
                          className="h-4 w-4 text-success"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-[--radius-md] border border-warning/20 bg-warning/5 px-3 py-2.5">
                  <p className="text-xs text-warning">
                    Share this API key with the user. It won&apos;t be shown
                    again.
                  </p>
                </div>

                <Button variant="primary" className="w-full" onClick={closeKeyResult}>
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
