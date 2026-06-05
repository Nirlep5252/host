"use client";

import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Button, Input } from "@/components/ui";
import type { DomainVisibility } from "@/lib/api/settings";
import { CloseIcon } from "./icons";

type AddDomainModalProps = {
  isOpen: boolean;
  domainName: string;
  visibility: DomainVisibility;
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onDomainNameChange: (value: string) => void;
  onVisibilityChange: (value: DomainVisibility) => void;
  onSubmit: () => void;
};

export function AddDomainModal({
  isOpen,
  domainName,
  visibility,
  error,
  isSubmitting,
  onClose,
  onDomainNameChange,
  onVisibilityChange,
  onSubmit,
}: AddDomainModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-[--radius-lg] border border-border-default bg-bg-secondary p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                Add Custom Domain
              </h3>
              <button
                onClick={onClose}
                className="text-text-muted transition-colors hover:text-text-primary"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Domain"
                type="text"
                placeholder="images.example.com"
                value={domainName}
                onChange={(event) => onDomainNameChange(event.target.value)}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Visibility
                </label>
                <div className="space-y-2">
                  <VisibilityOption
                    value="private"
                    checked={visibility === "private"}
                    label="Private"
                    description="Only you can use this domain"
                    onChange={onVisibilityChange}
                  />
                  <VisibilityOption
                    value="public"
                    checked={visibility === "public"}
                    label="Public"
                    description="Anyone can use (requires admin approval)"
                    onChange={onVisibilityChange}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onSubmit}
                  disabled={isSubmitting || !domainName.trim()}
                >
                  {isSubmitting ? "Adding..." : "Add Domain"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type VisibilityOptionProps = {
  value: DomainVisibility;
  checked: boolean;
  label: string;
  description: string;
  onChange: (value: DomainVisibility) => void;
};

function VisibilityOption({
  value,
  checked,
  label,
  description,
  onChange,
}: VisibilityOptionProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[--radius-md] border border-border-default bg-bg-tertiary p-3 transition-colors hover:border-border-focus">
      <input
        type="radio"
        name="visibility"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5"
      />
      <div>
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </label>
  );
}
