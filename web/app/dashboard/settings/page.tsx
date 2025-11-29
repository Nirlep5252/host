"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Card } from "@/components/ui";
import * as motion from "motion/react-client";

export default function SettingsPage() {
  const { apiKey, regenerateApiKey, setApiKey } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!confirm("Are you sure you want to regenerate your API key? Your old key will stop working immediately.")) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const key = await regenerateApiKey();
      setNewKey(key);
      setShowKey(true);
    } catch {
      setError("Failed to regenerate API key. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    const keyToCopy = newKey || apiKey;
    if (!keyToCopy) return;

    await navigator.clipboard.writeText(keyToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 6)}${"•".repeat(20)}${apiKey.slice(-4)}` : "No API key";
  const displayKey = showKey ? (newKey || apiKey) : maskedKey;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-text-secondary">
          Manage your account settings and API key
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">API Key</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Use this key to upload images via ShareX or the API
          </p>
        </div>

        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-[--radius-md] border border-warning bg-warning/10 p-4"
          >
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-medium text-warning">Save your API key now</p>
                <p className="text-sm text-text-secondary mt-1">
                  This is the only time you&apos;ll see your full API key. Copy it and store it securely.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 overflow-hidden rounded-[--radius-md] border border-border-default bg-bg-tertiary px-4 py-3 font-[family-name:var(--font-geist-mono)] text-sm text-text-primary tracking-wide">
            <span className="block truncate">{displayKey}</span>
          </div>

          <Button
            variant="secondary"
            onClick={handleCopy}
            disabled={!apiKey && !newKey}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </Button>

          {apiKey && !newKey && (
            <Button
              variant="ghost"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-error">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-6">
          <div>
            <p className="text-sm font-medium text-text-primary">Regenerate API Key</p>
            <p className="text-sm text-text-muted">
              This will invalidate your current key
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? "Regenerating..." : "Regenerate Key"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
