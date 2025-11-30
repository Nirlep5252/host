"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAdminDeleteUser, useAdminRegenerateKey } from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import { Button } from "@/components/ui";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

interface UserTableProps {
  users: AdminUser[];
  onCopyKey?: (key: string) => void;
}

type ActionState = {
  type: "delete" | "regenerate" | "key-result";
  userId: string;
  key?: string;
};

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
  const index = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UserTable({ users, onCopyKey }: UserTableProps) {
  const { adminKey } = useAuth();
  const deleteMutation = useAdminDeleteUser(adminKey || "");
  const regenerateMutation = useAdminRegenerateKey(adminKey || "");
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDelete = async (userId: string) => {
    if (actionState?.type === "delete" && actionState.userId === userId) {
      await deleteMutation.mutateAsync(userId);
      setActionState(null);
    } else {
      setActionState({ type: "delete", userId });
      setTimeout(() => {
        setActionState((current) =>
          current?.type === "delete" && current.userId === userId ? null : current
        );
      }, 3000);
    }
  };

  const handleRegenerate = async (userId: string) => {
    if (actionState?.type === "regenerate" && actionState.userId === userId) {
      const result = await regenerateMutation.mutateAsync(userId);
      setActionState({ type: "key-result", userId, key: result.apiKey });
    } else {
      setActionState({ type: "regenerate", userId });
      setTimeout(() => {
        setActionState((current) =>
          current?.type === "regenerate" && current.userId === userId ? null : current
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

  const formatDate = (dateStr: string) => {
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
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <motion.div
            key={user.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group relative rounded-[--radius-lg] border p-4 transition-all duration-200 ${
              user.isActive
                ? "border-border-default bg-bg-secondary hover:border-border-subtle hover:bg-bg-hover"
                : "border-border-subtle bg-bg-tertiary/30"
            }`}
          >
            {/* Header: Avatar + Status */}
            <div className="mb-3 flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(user.email)}`}>
                {getInitials(user.email, user.name)}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-success" : "bg-error"}`} />
                <span className={`text-xs ${user.isActive ? "text-success" : "text-error"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-3">
              <p className={`truncate font-medium ${user.isActive ? "text-text-primary" : "text-text-secondary"}`}>
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="mt-0.5 truncate text-sm text-text-muted">{user.email}</p>
              <p className="mt-1.5 text-xs text-text-secondary">
                {user.imageCount} {user.imageCount === 1 ? "image" : "images"} · {formatBytes(user.storageBytes)}
              </p>
            </div>

            {/* Footer: Date + Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Joined {formatDate(user.createdAt)}</span>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {actionState?.type === "regenerate" && actionState.userId === user.id ? (
                  <button
                    onClick={() => handleRegenerate(user.id)}
                    disabled={regenerateMutation.isPending}
                    className="rounded-[--radius-sm] bg-warning/10 px-2 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
                  >
                    {regenerateMutation.isPending ? "..." : "Confirm"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegenerate(user.id)}
                    className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                    title="Regenerate key"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}

                {user.isActive && (
                  actionState?.type === "delete" && actionState.userId === user.id ? (
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-[--radius-sm] bg-error/10 px-2 py-1 text-xs font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "..." : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      title="Deactivate"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  )
                )}
              </div>
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
                    <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
                      Key Regenerated
                    </h2>
                    <p className="text-sm text-text-muted">Copy the new key now</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    New API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-[--radius-md] bg-bg-tertiary px-3 py-2.5 font-mono text-sm text-accent break-all">
                      {actionState.key}
                    </code>
                    <button
                      onClick={() => handleCopyKey(actionState.key!)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[--radius-md] bg-bg-tertiary text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                    >
                      {copied ? (
                        <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-[--radius-md] border border-warning/20 bg-warning/5 px-3 py-2.5">
                  <p className="text-xs text-warning">
                    The old key no longer works. Share this new key with the user.
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
