"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { imagesQuery, useUpdateImage, useDeleteImage } from "@/lib/api";
import { useState, useCallback } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { Image } from "@/lib/api";
import { ImageLightbox } from "./image-lightbox";
import { FallbackImage } from "@/components/ui";
import { useMasonryOrder } from "@/lib/hooks/use-masonry-order";

const DEFAULT_DOMAIN = "formality.life";

function buildFallbackUrl(domain: string, imageId: string, originalUrl: string): string {
  if (domain === DEFAULT_DOMAIN) return originalUrl;
  const url = new URL(originalUrl);
  const token = url.searchParams.get("token");
  let fallbackUrl = `https://${DEFAULT_DOMAIN}/i/${imageId}`;
  if (token) {
    fallbackUrl = `${fallbackUrl}?token=${token}`;
  }
  return fallbackUrl;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface ImageGridProps {
  onCopySuccess?: (url: string) => void;
}

function ImageCard({
  image,
  onClick,
  onCopy,
  onToggleVisibility,
  onDelete,
  onFallback,
  deleteConfirm,
  isUpdating,
}: {
  image: Image;
  onClick: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onFallback: (imageId: string) => void;
  deleteConfirm: boolean;
  isUpdating: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative mb-4 cursor-pointer break-inside-avoid"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-[--radius-lg] bg-bg-tertiary border border-border-default transition-all duration-300 group-hover:border-border-subtle group-hover:shadow-xl group-hover:shadow-black/40">
        {!isLoaded && (
          <div className="aspect-[4/3] animate-pulse bg-bg-tertiary" />
        )}
        <FallbackImage
          src={image.url}
          domain={image.domain}
          imageId={image.id}
          isPrivate={image.isPrivate}
          onFallback={onFallback}
          alt={image.originalName || image.id}
          className={`w-full h-auto transition-transform duration-500 group-hover:scale-105 ${!isLoaded ? "absolute inset-0 opacity-0" : ""}`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top-right action buttons */}
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <button
            onClick={onCopy}
            className="flex h-8 w-8 items-center justify-center rounded-[--radius-sm] bg-bg-tertiary/80 text-text-secondary backdrop-blur-sm transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Copy URL"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onToggleVisibility}
            disabled={isUpdating}
            className="flex h-8 w-8 items-center justify-center rounded-[--radius-sm] bg-bg-tertiary/80 text-text-secondary backdrop-blur-sm transition-colors hover:bg-bg-hover hover:text-text-primary disabled:opacity-50"
            title={image.isPrivate ? "Make public" : "Make private"}
          >
            {image.isPrivate ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-[--radius-sm] bg-bg-tertiary/80 text-text-secondary backdrop-blur-sm transition-colors hover:bg-error-muted hover:text-error"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {image.originalName || image.id}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                <span>{formatBytes(image.sizeBytes)}</span>
                <span>·</span>
                <span className={image.isPrivate ? "text-error" : "text-success"}>
                  {image.isPrivate ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expand icon in center on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-border-default bg-bg-tertiary text-text-primary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[--radius-lg] bg-bg-primary/95 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-text-primary">Delete this image?</p>
            <p className="text-xs text-text-muted">Click delete again to confirm</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ImageGrid({ onCopySuccess }: ImageGridProps) {
  const { apiKey } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [fallbackImages, setFallbackImages] = useState<Set<string>>(new Set());
  const { reorderItems } = useMasonryOrder();

  const { data, isLoading, error } = useQuery(imagesQuery(apiKey || ""));
  const updateMutation = useUpdateImage(apiKey || "");
  const deleteMutation = useDeleteImage(apiKey || "");

  const allImages = data?.images || [];

  const getImageUrl = useCallback((img: Image) => {
    if (fallbackImages.has(img.id)) {
      return buildFallbackUrl(img.domain, img.id, img.url);
    }
    return img.url;
  }, [fallbackImages]);

  const handleImageFallback = useCallback((imageId: string) => {
    setFallbackImages(prev => new Set(prev).add(imageId));
  }, []);

  const openLightbox = (imageId: string) => {
    const index = allImages.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      setLightboxIndex(index);
    }
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const handleCopy = async (id: string) => {
    const image = allImages.find((img) => img.id === id);
    if (image) {
      const url = getImageUrl(image);
      await navigator.clipboard.writeText(url);
      onCopySuccess?.(url);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const image = allImages.find((img) => img.id === id);
    if (image) {
      await updateMutation.mutateAsync({
        id,
        isPrivate: !image.isPrivate,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      if (lightboxIndex !== null) {
        const currentImage = allImages[lightboxIndex];
        if (currentImage?.id === id) {
          if (allImages.length === 1) {
            closeLightbox();
          } else if (lightboxIndex === allImages.length - 1) {
            setLightboxIndex(lightboxIndex - 1);
          }
        }
      }
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (isLoading) {
    const skeletonHeights = [180, 240, 160, 280, 200, 220, 190, 260];
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {skeletonHeights.map((height, i) => (
          <div
            key={i}
            className="mb-4 animate-pulse rounded-[--radius-lg] bg-bg-tertiary break-inside-avoid"
            style={{ height: `${height}px`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-error/20 bg-error-muted py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-muted">
          <svg className="h-6 w-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-error">Failed to load images</p>
        <p className="mt-1 text-xs text-text-muted">Please try refreshing the page</p>
      </div>
    );
  }

  if (!allImages.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary">
          <svg className="h-8 w-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="font-[family-name:var(--font-display)] text-lg font-medium text-text-primary">
          No images yet
        </p>
        <p className="mt-1 text-sm text-text-muted">Drop an image anywhere or use the upload button</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {reorderItems(allImages).map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onClick={() => openLightbox(image.id)}
            onCopy={(e) => {
              e.stopPropagation();
              handleCopy(image.id);
            }}
            onToggleVisibility={(e) => {
              e.stopPropagation();
              handleToggleVisibility(image.id);
            }}
            onDelete={(e) => {
              e.stopPropagation();
              handleDelete(image.id);
            }}
            onFallback={handleImageFallback}
            deleteConfirm={deleteConfirm === image.id}
            isUpdating={updateMutation.isPending}
          />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && allImages[lightboxIndex] && (
          <ImageLightbox
            images={allImages}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onNavigate={setLightboxIndex}
            onCopy={handleCopy}
            onToggleVisibility={handleToggleVisibility}
            onDelete={handleDelete}
            isUpdating={updateMutation.isPending}
            getImageUrl={getImageUrl}
          />
        )}
      </AnimatePresence>
    </>
  );
}
