"use client";

import { Badge } from "./badge";

export interface ImageCardProps {
  id: string;
  filename: string;
  size: string;
  isPrivate?: boolean;
  thumbnailUrl?: string;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function ImageCard({
  id,
  filename,
  size,
  isPrivate = false,
  thumbnailUrl,
  onCopy,
  onDelete,
}: ImageCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[--radius-md] border border-border-default bg-bg-secondary transition-all duration-200 hover:border-accent/50">
      {thumbnailUrl ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={filename}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-accent/20 via-bg-tertiary to-bg-secondary" />
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex gap-2">
          {onCopy && (
            <button
              onClick={() => onCopy(id)}
              className="rounded-[--radius-sm] bg-bg-primary/80 p-2 text-text-primary backdrop-blur-sm transition-colors hover:bg-bg-primary"
              title="Copy link"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="rounded-[--radius-sm] bg-bg-primary/80 p-2 text-text-primary backdrop-blur-sm transition-colors hover:bg-error hover:text-white"
              title="Delete"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-text-secondary">
            {filename}
          </span>
          <span className="text-xs text-text-muted">{size}</span>
        </div>
        <Badge variant={isPrivate ? "error" : "success"}>
          {isPrivate ? "Private" : "Public"}
        </Badge>
      </div>
    </div>
  );
}

export { ImageCard };
