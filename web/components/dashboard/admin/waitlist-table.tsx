"use client";

import {
  useAdminApproveWaitlist,
  useAdminRejectWaitlist,
  useAdminDeleteWaitlist,
} from "@/lib/api";
import type { WaitlistEntry } from "@/lib/api";
import { useTemporaryState } from "@/lib/hooks/use-temporary-state";
import * as motion from "motion/react-client";
import {
  ApiKeyResultDialog,
  formatAdminDate,
  getAvatarColor,
  getInitials,
} from "./admin-ui";

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

export function WaitlistTable({ entries, onCopyKey }: WaitlistTableProps) {
  const approveMutation = useAdminApproveWaitlist();
  const rejectMutation = useAdminRejectWaitlist();
  const deleteMutation = useAdminDeleteWaitlist();
  const {
    value: actionState,
    setValue: setActionState,
    setTemporaryValue: setTemporaryActionState,
    reset: resetActionState,
  } = useTemporaryState<ActionState | null>(null, 3000);

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
      setTemporaryActionState({ type: "approve", entryId: entry.id });
    }
  };

  const handleReject = async (entryId: string) => {
    if (actionState?.type === "reject" && actionState.entryId === entryId) {
      await rejectMutation.mutateAsync(entryId);
      resetActionState();
    } else {
      setTemporaryActionState({ type: "reject", entryId });
    }
  };

  const handleDelete = async (entryId: string) => {
    if (actionState?.type === "delete" && actionState.entryId === entryId) {
      await deleteMutation.mutateAsync(entryId);
      resetActionState();
    } else {
      setTemporaryActionState({ type: "delete", entryId });
    }
  };

  const closeKeyResult = () => {
    resetActionState();
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
                {formatAdminDate(entry.createdAt)}
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

      <ApiKeyResultDialog
        apiKey={actionState?.type === "key-result" ? actionState.key ?? null : null}
        title="User Created"
        subtitle={actionState?.type === "key-result" ? actionState.user?.email ?? "" : ""}
        warning="Share this API key with the user. It won't be shown again."
        onCopied={onCopyKey}
        onClose={closeKeyResult}
      />
    </>
  );
}
