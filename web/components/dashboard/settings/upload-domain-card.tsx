"use client";

import { useEffect, useRef } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Card } from "@/components/ui";
import type { UserDomain } from "@/lib/api/settings";
import { CheckIcon, GlobeIcon } from "./icons";

type UploadDomainCardProps = {
  domains: UserDomain[];
  selectedDomainId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDropdownOpen: boolean;
  onDropdownOpenChange: (isOpen: boolean) => void;
  onSelectDomain: (domainId: string) => void;
};

export function UploadDomainCard({
  domains,
  selectedDomainId,
  isLoading,
  isSaving,
  error,
  isDropdownOpen,
  onDropdownOpenChange,
  onSelectDomain,
}: UploadDomainCardProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedDomain = domains.find((domain) => domain.id === selectedDomainId);
  const selectedDomainName =
    selectedDomain?.domain ||
    domains.find((domain) => domain.isDefault)?.domain ||
    "formality.life";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onDropdownOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onDropdownOpenChange]);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Upload Domain</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose the domain for your new image URLs
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading domains..." />
      ) : domains.length === 0 ? (
        <div className="rounded-[--radius-md] border border-dashed border-border-default p-6 text-center">
          <GlobeIcon className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">No domains configured yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => onDropdownOpenChange(!isDropdownOpen)}
              disabled={isSaving}
              className={`
                flex w-full items-center justify-between gap-3 rounded-[--radius-md] border px-4 py-3
                transition-all duration-200 ease-out
                ${isDropdownOpen
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-border-default bg-bg-tertiary hover:border-border-focus hover:bg-bg-hover"
                }
                ${isSaving ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                  <GlobeIcon className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary">{selectedDomainName}</p>
                  <p className="text-xs text-text-muted">
                    {selectedDomain?.isDefault || !selectedDomain
                      ? "Default domain"
                      : "Custom domain"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
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
                      <DomainOption
                        key={domain.id}
                        domain={domain}
                        isSelected={selectedDomainId === domain.id}
                        index={index}
                        onSelect={onSelectDomain}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-[--radius-md] border border-border-subtle bg-bg-tertiary/50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              Preview
            </p>
            <code className="flex-1 font-[family-name:var(--font-geist-mono)] text-sm text-text-secondary">
              https://<span className="text-accent">{selectedDomainName}</span>/i/<span className="text-text-muted">abc123</span>
            </code>
          </div>
        </div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-error"
        >
          {error}
        </motion.p>
      )}

      <p className="mt-4 text-xs text-text-muted">
        Changing your domain only affects new uploads. Existing images keep their original URLs.
      </p>
    </Card>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-text-muted">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

type DomainOptionProps = {
  domain: UserDomain;
  isSelected: boolean;
  index: number;
  onSelect: (domainId: string) => void;
};

function DomainOption({ domain, isSelected, index, onSelect }: DomainOptionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      onClick={() => onSelect(domain.id)}
      className={`
        flex w-full items-center gap-3 px-4 py-3 transition-colors duration-150
        ${isSelected ? "bg-accent/10 text-accent" : "text-text-primary hover:bg-bg-hover"}
      `}
    >
      <div
        className={`
          flex h-6 w-6 items-center justify-center rounded-full
          ${isSelected ? "bg-accent/20" : "bg-bg-tertiary"}
        `}
      >
        {isSelected ? (
          <CheckIcon className="h-3.5 w-3.5 text-accent" />
        ) : (
          <svg className="h-3.5 w-3.5 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="8" />
          </svg>
        )}
      </div>
      <div className="flex-1 text-left">
        <span className="font-medium">{domain.domain}</span>
        {domain.isDefault && (
          <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            Default
          </span>
        )}
      </div>
    </motion.button>
  );
}
