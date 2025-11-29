"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { imagesQuery, useUpdateImage, useDeleteImage } from "@/lib/api";
import { Badge } from "@/components/ui";
import { useState } from "react";
import * as motion from "motion/react-client";
import type { Image } from "@/lib/api";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getTimeGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    return "Today";
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "This month";
  return "Earlier";
}

function groupImagesByTime(images: Image[]): Record<string, Image[]> {
  const groups: Record<string, Image[]> = {};
  const order = ["Just now", "Today", "Yesterday", "This week", "This month", "Earlier"];

  for (const image of images) {
    const group = getTimeGroup(image.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(image);
  }

  const sorted: Record<string, Image[]> = {};
  for (const key of order) {
    if (groups[key]) sorted[key] = groups[key];
  }
  return sorted;
}

interface ImageGridProps {
  onCopySuccess?: (url: string) => void;
}

function ImageItem({
  image,
  onCopy,
  onToggleVisibility,
  onDelete,
  deleteConfirm,
  isUpdating,
}: {
  image: Image;
  onCopy: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  deleteConfirm: string | null;
  isUpdating: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-[--radius-md] border border-border-default bg-bg-secondary transition-all duration-200 hover:border-border-subtle hover:shadow-lg hover:shadow-black/20">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-bg-tertiary">
          <img
            src={image.url}
            alt={image.originalName || image.id}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={() => onCopy(image.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110"
              title="Copy URL"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => onToggleVisibility(image.id)}
              disabled={isUpdating}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110 disabled:opacity-50"
              title={image.isPrivate ? "Make public" : "Make private"}
            >
              {image.isPrivate ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => onDelete(image.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-error/80 hover:scale-110"
              title="Delete"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-text-secondary">
              {image.originalName || image.id}
            </p>
            <p className="text-xs text-text-muted">{formatBytes(image.sizeBytes)}</p>
          </div>
          <Badge variant={image.isPrivate ? "error" : "success"} className="ml-2 shrink-0">
            {image.isPrivate ? "Private" : "Public"}
          </Badge>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {deleteConfirm === image.id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[--radius-md] bg-bg-primary/95 backdrop-blur-sm"
        >
          <p className="text-sm font-medium text-text-primary">Delete this image?</p>
          <p className="text-xs text-text-muted">Click delete again to confirm</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export function ImageGrid({ onCopySuccess }: ImageGridProps) {
  const { apiKey } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(imagesQuery(apiKey || ""));
  const updateMutation = useUpdateImage(apiKey || "");
  const deleteMutation = useDeleteImage(apiKey || "");

  const handleCopy = async (id: string) => {
    const image = data?.images.find((img) => img.id === id);
    if (image) {
      await navigator.clipboard.writeText(image.url);
      onCopySuccess?.(image.url);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const image = data?.images.find((img) => img.id === id);
    if (image) {
      await updateMutation.mutateAsync({
        id,
        isPrivate: !image.isPrivate,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="mb-4 h-5 w-20 animate-pulse rounded bg-bg-tertiary" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-[--radius-md] bg-bg-tertiary" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-error/20 bg-error/5 py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
          <svg className="h-6 w-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-error">Failed to load images</p>
        <p className="mt-1 text-xs text-text-muted">Please try refreshing the page</p>
      </div>
    );
  }

  if (!data?.images.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary">
          <svg className="h-8 w-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-[family-name:var(--font-display)] text-lg font-medium text-text-primary">No images yet</p>
        <p className="mt-1 text-sm text-text-muted">Drop an image anywhere or use the upload button</p>
      </div>
    );
  }

  const groupedImages = groupImagesByTime(data.images);

  return (
    <div className="space-y-10">
      {Object.entries(groupedImages).map(([group, images]) => (
        <section key={group}>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-text-muted">
              {group}
            </h3>
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-text-muted">{images.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image) => (
              <ImageItem
                key={image.id}
                image={image}
                onCopy={handleCopy}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDelete}
                deleteConfirm={deleteConfirm}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
