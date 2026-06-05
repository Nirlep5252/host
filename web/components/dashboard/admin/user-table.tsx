"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAdminDeleteUser, useAdminCreateKey, useAdminUpdateUser } from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import { Button } from "@/components/ui";
import { useTemporaryState } from "@/lib/hooks/use-temporary-state";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  ApiKeyResultDialog,
  formatAdminDate,
  getAvatarColor,
  getInitials,
} from "./admin-ui";
import {
  formatBytes,
  getStorageProgressColor,
  getStorageUsageTextColor,
  getUsagePercent,
} from "@/lib/format";

const DEFAULT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

const STORAGE_PRESETS = [
  { label: "1 GB", bytes: 1 * 1024 * 1024 * 1024 },
  { label: "5 GB", bytes: 5 * 1024 * 1024 * 1024 },
  { label: "10 GB", bytes: 10 * 1024 * 1024 * 1024 },
  { label: "50 GB", bytes: 50 * 1024 * 1024 * 1024 },
  { label: "100 GB", bytes: 100 * 1024 * 1024 * 1024 },
];

interface UserTableProps {
  users: AdminUser[];
  onCopyKey?: (key: string) => void;
}

type ActionState = {
  type: "delete" | "create-key" | "key-result" | "edit-storage";
  userId: string;
  key?: string;
  currentLimit?: number | null;
};

function getStorageLimit(storageLimitBytes: number | null): number {
  return storageLimitBytes ?? DEFAULT_STORAGE_LIMIT_BYTES;
}

export function UserTable({ users, onCopyKey }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const deleteMutation = useAdminDeleteUser();
  const createKeyMutation = useAdminCreateKey();
  const updateUserMutation = useAdminUpdateUser();
  const {
    value: actionState,
    setValue: setActionState,
    setTemporaryValue: setTemporaryActionState,
    reset: resetActionState,
  } = useTemporaryState<ActionState | null>(null, 3000);
  const [customStorageInput, setCustomStorageInput] = useState("");

  const handleDelete = async (userId: string) => {
    if (actionState?.type === "delete" && actionState.userId === userId) {
      await deleteMutation.mutateAsync(userId);
      resetActionState();
    } else {
      setTemporaryActionState({ type: "delete", userId });
    }
  };

  const handleCreateKey = async (userId: string) => {
    if (actionState?.type === "create-key" && actionState.userId === userId) {
      const result = await createKeyMutation.mutateAsync(userId);
      setActionState({ type: "key-result", userId, key: result.apiKey });
    } else {
      setTemporaryActionState({ type: "create-key", userId });
    }
  };

  const handleRoleToggle = async (user: AdminUser) => {
    if (currentUser?.id === user.id && user.role === "admin") return;

    await updateUserMutation.mutateAsync({
      userId: user.id,
      role: user.role === "admin" ? "user" : "admin",
    });
  };

  const closeKeyResult = () => {
    resetActionState();
  };

  const openStorageEdit = (user: AdminUser) => {
    setActionState({
      type: "edit-storage",
      userId: user.id,
      currentLimit: user.storageLimitBytes,
    });
    setCustomStorageInput("");
  };

  const handleStorageLimitUpdate = async (bytes: number | null) => {
    if (!actionState || actionState.type !== "edit-storage") return;
    await updateUserMutation.mutateAsync({
      userId: actionState.userId,
      storageLimitBytes: bytes,
    });
    resetActionState();
    setCustomStorageInput("");
  };

  const handleCustomStorageSubmit = () => {
    const gb = parseFloat(customStorageInput);
    if (!isNaN(gb) && gb > 0) {
      handleStorageLimitUpdate(gb * 1024 * 1024 * 1024);
    }
  };

  const closeStorageEdit = () => {
    resetActionState();
    setCustomStorageInput("");
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
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    Admin
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-success" : "bg-error"}`} />
                  <span className={`text-xs ${user.isActive ? "text-success" : "text-error"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-3">
              <p className={`truncate font-medium ${user.isActive ? "text-text-primary" : "text-text-secondary"}`}>
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="mt-0.5 truncate text-sm text-text-muted">{user.email}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    {user.imageCount} {user.imageCount === 1 ? "image" : "images"}
                  </span>
                  <button
                    onClick={() => openStorageEdit(user)}
                    className="flex items-center gap-1 text-text-muted transition-colors hover:text-accent"
                    title="Edit storage limit"
                  >
                    <span className={getStorageUsageTextColor(getUsagePercent(user.storageBytes, getStorageLimit(user.storageLimitBytes)))}>
                      {formatBytes(user.storageBytes)} / {formatBytes(getStorageLimit(user.storageLimitBytes))}
                    </span>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className={`h-full rounded-full transition-all ${getStorageProgressColor(getUsagePercent(user.storageBytes, getStorageLimit(user.storageLimitBytes)))}`}
                    style={{ width: `${getUsagePercent(user.storageBytes, getStorageLimit(user.storageLimitBytes))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer: Date + Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Joined {formatAdminDate(user.createdAt)}</span>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleRoleToggle(user)}
                  disabled={
                    updateUserMutation.isPending ||
                    (currentUser?.id === user.id && user.role === "admin")
                  }
                  className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    currentUser?.id === user.id && user.role === "admin"
                      ? "You cannot demote yourself"
                      : user.role === "admin"
                        ? "Make user"
                        : "Make admin"
                  }
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l7 4v5c0 4.5-3 8.5-7 9-4-0.5-7-4.5-7-9V7l7-4z" />
                  </svg>
                </button>

                {actionState?.type === "create-key" && actionState.userId === user.id ? (
                  <button
                    onClick={() => handleCreateKey(user.id)}
                    disabled={createKeyMutation.isPending}
                    className="rounded-[--radius-sm] bg-warning/10 px-2 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/20 disabled:opacity-50"
                  >
                    {createKeyMutation.isPending ? "..." : "Confirm"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCreateKey(user.id)}
                    className="rounded-[--radius-sm] p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                    title="Create API key"
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

      <ApiKeyResultDialog
        apiKey={actionState?.type === "key-result" ? actionState.key ?? null : null}
        title="Key Created"
        subtitle="Copy the new key now"
        warning="This key will only be shown once. Share it with the user now."
        onCopied={onCopyKey}
        onClose={closeKeyResult}
      />

      {/* Storage Edit Modal */}
      <AnimatePresence>
        {actionState?.type === "edit-storage" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-6 shadow-2xl"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
                      Storage Limit
                    </h2>
                    <p className="text-sm text-text-muted">
                      Current: {formatBytes(getStorageLimit(actionState.currentLimit ?? null))}
                      {actionState.currentLimit === null && " (default)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Preset Limits
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STORAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.bytes}
                        onClick={() => handleStorageLimitUpdate(preset.bytes)}
                        disabled={updateUserMutation.isPending}
                        className={`rounded-[--radius-md] border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                          getStorageLimit(actionState.currentLimit ?? null) === preset.bytes
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border-default bg-bg-tertiary text-text-secondary hover:border-accent/50 hover:text-text-primary"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleStorageLimitUpdate(null)}
                      disabled={updateUserMutation.isPending}
                      className={`rounded-[--radius-md] border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                        actionState.currentLimit === null
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-default bg-bg-tertiary text-text-secondary hover:border-accent/50 hover:text-text-primary"
                      }`}
                    >
                      Default
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    Custom (GB)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={customStorageInput}
                      onChange={(e) => setCustomStorageInput(e.target.value)}
                      placeholder="e.g. 25"
                      className="flex-1 rounded-[--radius-md] border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleCustomStorageSubmit}
                      disabled={updateUserMutation.isPending || !customStorageInput}
                    >
                      Set
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" className="w-full" onClick={closeStorageEdit}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
