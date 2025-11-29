"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui";
import { useUploadImage } from "@/lib/api";
import { ImageGrid } from "@/components/dashboard/image-grid";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

export default function DashboardPage() {
  const { user, apiKey } = useAuth();
  const { toast } = useToast();
  const uploadMutation = useUploadImage(apiKey || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        const result = await uploadMutation.mutateAsync(file);
        await navigator.clipboard.writeText(result.url);
        toast("Uploaded! URL copied to clipboard");
        setIsUploadExpanded(false);
      } catch {
        toast("Upload failed. Please try again.", "error" as any);
      }
    },
    [uploadMutation, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload]
  );

  const handleCopySuccess = () => {
    toast("URL copied to clipboard");
  };

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
            Images
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {user?.imageCount || 0} images in your library
          </p>
        </div>

        {/* Upload button */}
        <button
          onClick={() => setIsUploadExpanded(!isUploadExpanded)}
          className="group flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isUploadExpanded ? "rotate-45" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </button>
      </div>

      {/* Expanded upload zone */}
      <AnimatePresence>
        {isUploadExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={`flex flex-col items-center justify-center rounded-[--radius-lg] border-2 border-dashed p-10 transition-colors ${
                uploadMutation.isPending
                  ? "border-accent/50 bg-accent/5"
                  : "border-border-default hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              {uploadMutation.isPending ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  <p className="text-sm text-text-secondary">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-center text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Drop an image</span> or{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-accent hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">PNG, JPG, GIF, WebP up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image grid */}
      <ImageGrid onCopySuccess={handleCopySuccess} />

      {/* Global drag overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20"
              >
                <svg className="h-12 w-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </motion.div>
              <p className="font-[family-name:var(--font-display)] text-xl font-medium text-text-primary">
                Drop to upload
              </p>
              <p className="text-sm text-text-muted">Release to start uploading</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
