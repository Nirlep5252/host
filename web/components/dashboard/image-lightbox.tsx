"use client";

import { useEffect, useCallback } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { Image } from "@/lib/api";
import { Button } from "@/components/ui";

interface ImageLightboxProps {
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onCopy: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onCopy,
  onToggleVisibility,
  onDelete,
  isUpdating,
}: ImageLightboxProps) {
  const image = images[currentIndex];
  const total = images.length;

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = image.url;
    a.download = image.originalName || image.id;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-bg-primary/95 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="h-10 w-10 p-0"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>

        <div className="font-mono text-sm text-text-muted">
          {currentIndex + 1} <span className="text-text-muted/50">/</span> {total}
        </div>

        <div className="w-10" />
      </div>

      {/* Main image area */}
      <div className="relative flex flex-1 items-center justify-center px-20">
        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-6 z-10 h-12 w-12 rounded-full p-0"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-6 z-10 h-12 w-12 rounded-full p-0"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </>
        )}

        {/* Image with crossfade */}
        <AnimatePresence mode="wait">
          <motion.img
            key={image.id}
            src={image.url}
            alt={image.originalName || image.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="max-h-[75vh] max-w-[85vw] rounded-[--radius-lg] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>
      </div>

      {/* Bottom info bar */}
      <div
        className="flex flex-col items-center gap-4 px-6 pb-6 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* File info */}
        <div className="flex items-center gap-3 text-sm">
          <span className="max-w-md truncate font-mono text-text-secondary">
            {image.originalName || image.id}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted">{formatBytes(image.sizeBytes)}</span>
          <span className="text-text-muted">·</span>
          <span className={image.isPrivate ? "text-error" : "text-success"}>
            {image.isPrivate ? "Private" : "Public"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(image.id)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy URL
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(image.id)}
            disabled={isUpdating}
          >
            {image.isPrivate ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Make Public
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Make Private
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(image.id)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
