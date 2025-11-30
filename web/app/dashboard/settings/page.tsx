"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@/components/ui";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://formality.life";

interface Domain {
  id: string;
  domain: string;
  isDefault: boolean;
}

export default function SettingsPage() {
  const { apiKey, regenerateApiKey, user } = useAuth();
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDomains() {
      try {
        const response = await fetch(`${API_BASE_URL}/me/domains`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          let domainList = data.domains || [];

          // Ensure there's always a default domain option
          const hasDefault = domainList.some((d: Domain) => d.isDefault);
          if (!hasDefault && domainList.length === 0) {
            // Add formality.life as fallback if no domains exist
            domainList = [{ id: "default", domain: "formality.life", isDefault: true }];
          }

          setDomains(domainList);
        }
      } catch {
        console.error("Failed to fetch domains");
        // Fallback to default domain on error
        setDomains([{ id: "default", domain: "formality.life", isDefault: true }]);
      } finally {
        setIsLoadingDomains(false);
      }
    }
    fetchDomains();
  }, []);

  useEffect(() => {
    if (user?.domainId) {
      setSelectedDomainId(user.domainId);
    } else if (domains.length > 0) {
      // User has no domain set, select the default one
      const defaultDomain = domains.find(d => d.isDefault);
      if (defaultDomain) {
        setSelectedDomainId(defaultDomain.id);
      } else {
        // No default marked, just select the first one
        setSelectedDomainId(domains[0].id);
      }
    }
  }, [user?.domainId, domains]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDomainChange = async (domainId: string) => {
    setIsDropdownOpen(false);
    if (domainId === selectedDomainId) return;

    setIsSavingDomain(true);
    setDomainError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/me/domain`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      if (!response.ok) {
        throw new Error("Failed to update domain");
      }
      setSelectedDomainId(domainId);
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
    } catch {
      setDomainError("Failed to update domain. Please try again.");
    } finally {
      setIsSavingDomain(false);
    }
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);
  const selectedDomainName = selectedDomain?.domain || domains.find(d => d.isDefault)?.domain || "formality.life";

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

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Upload Domain</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Choose the domain for your new image URLs
          </p>
        </div>

        {isLoadingDomains ? (
          <div className="flex items-center gap-3 text-text-muted">
            <div className="h-5 w-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            <span className="text-sm">Loading domains...</span>
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-[--radius-md] border border-dashed border-border-default p-6 text-center">
            <svg className="mx-auto h-8 w-8 text-text-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <p className="text-sm text-text-muted">No domains configured yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isSavingDomain}
                className={`
                  w-full flex items-center justify-between gap-3
                  rounded-[--radius-md] border px-4 py-3
                  transition-all duration-200 ease-out
                  ${isDropdownOpen
                    ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                    : "border-border-default bg-bg-tertiary hover:border-border-focus hover:bg-bg-hover"
                  }
                  ${isSavingDomain ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                    <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-primary">{selectedDomainName}</p>
                    <p className="text-xs text-text-muted">
                      {selectedDomain?.isDefault || !selectedDomain ? "Default domain" : "Custom domain"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSavingDomain && (
                    <div className="h-4 w-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                  )}
                  <motion.svg
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-5 w-5 text-text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute z-50 mt-2 w-full overflow-hidden rounded-[--radius-md] border border-border-default bg-bg-secondary shadow-xl shadow-black/20"
                  >
                    <div className="py-1">
                      {domains.map((domain, index) => (
                        <motion.button
                          key={domain.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.03 }}
                          onClick={() => handleDomainChange(domain.id)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3
                            transition-colors duration-150
                            ${selectedDomainId === domain.id
                              ? "bg-accent/10 text-accent"
                              : "text-text-primary hover:bg-bg-hover"
                            }
                          `}
                        >
                          <div className={`
                            flex h-6 w-6 items-center justify-center rounded-full
                            ${selectedDomainId === domain.id ? "bg-accent/20" : "bg-bg-tertiary"}
                          `}>
                            {selectedDomainId === domain.id ? (
                              <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="8" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-medium">{domain.domain}</span>
                            {domain.isDefault && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent uppercase tracking-wide">
                                Default
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-[--radius-md] bg-bg-tertiary/50 border border-border-subtle p-4">
              <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-medium">Preview</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-[family-name:var(--font-geist-mono)] text-sm text-text-secondary">
                  https://<span className="text-accent">{selectedDomainName}</span>/i/<span className="text-text-muted">abc123</span>
                </code>
              </div>
            </div>
          </div>
        )}

        {domainError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm text-error"
          >
            {domainError}
          </motion.p>
        )}

        <p className="mt-4 text-xs text-text-muted">
          Changing your domain only affects new uploads. Existing images keep their original URLs.
        </p>
      </Card>
    </div>
  );
}
