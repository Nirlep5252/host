"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatRelativeDate } from "@/lib/format";
import { useTemporaryFlag } from "@/lib/hooks/use-temporary-state";
import { fetchApiKeys, settingsKeys } from "@/lib/api/settings";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "./icons";

const MAX_API_KEYS = 10;

function downloadShareXConfig(apiKey: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://formality.life";
  const config = {
    Version: "16.0.0",
    Name: "formality.life",
    DestinationType: "ImageUploader",
    RequestMethod: "POST",
    RequestURL: `${baseUrl}/upload`,
    Headers: {
      "X-API-Key": apiKey ?? "",
    },
    Body: "MultipartFormData",
    FileFormName: "file",
    URL: "{json:url}",
  };

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "formality-life.sxcu";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ApiKeysCard() {
  const { createApiKey, revokeApiKey, apiKey } = useAuth();
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: settingsKeys.apiKeys,
    queryFn: fetchApiKeys,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { active: copied, activate: markCopied } = useTemporaryFlag(2000);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateKey = async () => {
    const name = newKeyName.trim();
    if (!name) {
      setKeyError("Key name is required");
      return;
    }

    setIsCreating(true);
    setKeyError(null);
    try {
      const key = await createApiKey(name);
      setNewlyCreatedKey(key);
      setNewKeyName("");
      setShowCreateForm(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? It will stop working immediately.")) {
      return;
    }

    setDeletingKeyId(id);
    try {
      await revokeApiKey(id);
    } catch {
      alert("Failed to revoke API key");
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleCopyKey = async () => {
    if (!newlyCreatedKey) return;

    await navigator.clipboard.writeText(newlyCreatedKey);
    markCopied();
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your API keys for uploading images via ShareX or the API
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setShowCreateForm(true);
            setNewlyCreatedKey(null);
          }}
          disabled={apiKeys.length >= MAX_API_KEYS}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Key
        </Button>
      </div>

      <AnimatePresence>
        {newlyCreatedKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 rounded-[--radius-md] border border-warning bg-warning/10 p-4"
          >
            <div className="mb-3 flex items-start gap-3">
              <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
              <div>
                <p className="font-medium text-warning">Save your API key now</p>
                <p className="mt-1 text-sm text-text-secondary">
                  This is the only time you&apos;ll see your full API key. Copy it and store it securely.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-[--radius-md] bg-bg-tertiary px-4 py-3 font-[family-name:var(--font-geist-mono)] text-sm text-accent">
                {newlyCreatedKey}
              </code>
              <Button variant="secondary" onClick={handleCopyKey}>
                {copied ? (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <button
              onClick={() => downloadShareXConfig(newlyCreatedKey || apiKey)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[--radius-md] border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <DownloadIcon />
              Download ShareX Config
            </button>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-2 w-full text-center text-xs text-text-muted hover:text-text-secondary"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateForm && !newlyCreatedKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-[--radius-md] border border-border-default bg-bg-tertiary p-4">
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Key Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  placeholder="e.g. MacBook, Desktop, ShareX"
                  className="flex-1 rounded-[--radius-md] border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  onKeyDown={(event) => event.key === "Enter" && handleCreateKey()}
                  autoFocus
                />
                <Button
                  variant="primary"
                  onClick={handleCreateKey}
                  disabled={isCreating || !newKeyName.trim()}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setKeyError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              {keyError && <p className="mt-2 text-sm text-error">{keyError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center gap-3 text-text-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm">Loading API keys...</span>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="rounded-[--radius-md] border border-dashed border-border-default p-8 text-center">
          <KeyIcon className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="font-medium text-text-secondary">No API keys</p>
          <p className="mt-1 text-sm text-text-muted">
            Create an API key to start uploading images
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-[--radius-md] border border-border-default bg-bg-tertiary px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <KeyIcon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-text-primary">{key.name}</p>
                    <code className="font-[family-name:var(--font-geist-mono)] text-xs text-text-muted">
                      {key.keyPrefix}...
                    </code>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className="text-xs text-text-muted">
                      Created {formatDate(key.createdAt)}
                    </span>
                    <span className="text-xs text-text-muted">
                      Last used: {formatRelativeDate(key.lastUsedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeKey(key.id)}
                disabled={deletingKeyId === key.id}
              >
                {deletingKeyId === key.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                ) : (
                  <TrashIcon className="h-4 w-4 text-error" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {apiKeys.length >= MAX_API_KEYS && (
        <p className="mt-3 text-xs text-text-muted">
          Maximum of 10 API keys reached. Delete an existing key to create a new one.
        </p>
      )}
    </Card>
  );
}
