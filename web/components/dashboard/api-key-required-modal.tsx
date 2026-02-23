"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { modalContent, transition } from "@/lib/motion";

interface ApiKeyRequiredModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function ApiKeyRequiredModal({ isOpen, onComplete }: ApiKeyRequiredModalProps) {
  const { createApiKey, apiKey } = useAuth();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("Default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      setError("Please enter a name for your API key");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const newKey = await createApiKey(keyName.trim());
      if (newKey) {
        setGeneratedKey(newKey);
      } else {
        setError("Failed to generate API key. Please try again.");
      }
    } catch {
      setError("Failed to generate API key. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadShareXConfig = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://formality.life";
    const config = {
      Version: "16.0.0",
      Name: "formality.life",
      DestinationType: "ImageUploader",
      RequestMethod: "POST",
      RequestURL: `${baseUrl}/upload`,
      Headers: {
        "X-API-Key": generatedKey || apiKey,
      },
      Body: "MultipartFormData",
      FileFormName: "file",
      URL: "{json:url}",
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formality-life.sxcu";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm">
        <motion.div
          initial={modalContent.initial}
          animate={modalContent.animate}
          exit={modalContent.exit}
          transition={transition.normal}
          className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-8 shadow-2xl"
        >
          {generatedKey ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-primary">
                    API Key Generated
                  </h2>
                  <p className="text-sm text-text-muted">Copy your key now - it won't be shown again</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Your API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-[--radius-md] bg-bg-tertiary px-4 py-3 font-mono text-sm text-accent break-all">
                    {generatedKey}
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
                    Save this key securely. You'll need it to upload images via ShareX or the API.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleDownloadShareXConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] border border-border-default bg-bg-tertiary px-4 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download ShareX Config
                </button>

                <Button variant="primary" className="w-full" onClick={onComplete}>
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-primary">
                    Create Your API Key
                  </h2>
                  <p className="text-sm text-text-muted">Required to upload images</p>
                </div>
              </div>

              <p className="text-text-secondary">
                Welcome to formality.life! To start uploading images, you'll need to generate an API key.
                This key is used to authenticate your uploads via ShareX or the API.
              </p>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. MacBook, Desktop, ShareX"
                  className="w-full rounded-[--radius-md] border border-border-default bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div className="rounded-[--radius-md] border border-accent/20 bg-accent/5 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-text-secondary">
                    Your API key will only be shown once after generation. Make sure to save it securely.
                  </p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error">{error}</p>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={handleGenerateKey}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  "Generate API Key"
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
