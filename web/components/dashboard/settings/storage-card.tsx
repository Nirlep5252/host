"use client";

import { Card } from "@/components/ui";
import type { User } from "@/lib/auth-context";
import {
  formatBytes,
  getStorageProgressColor,
  getStorageUsageTextColor,
  getUsagePercent,
} from "@/lib/format";

type StorageCardProps = {
  user: User | null;
};

export function StorageCard({ user }: StorageCardProps) {
  const storageInfo =
    user?.storageBytes !== undefined && user?.storageLimitBytes !== undefined
    ? {
        bytes: user.storageBytes,
        limitBytes: user.storageLimitBytes,
        imageCount: user.imageCount ?? 0,
        usagePercent: getUsagePercent(user.storageBytes, user.storageLimitBytes),
      }
    : null;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Storage</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your storage usage and limits
        </p>
      </div>

      {storageInfo ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {formatBytes(storageInfo.bytes)}
              </p>
              <p className="text-sm text-text-muted">
                of {formatBytes(storageInfo.limitBytes)} used
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-text-secondary">
                {formatBytes(storageInfo.limitBytes - storageInfo.bytes)}
              </p>
              <p className="text-sm text-text-muted">remaining</p>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className={`h-full rounded-full transition-all ${getStorageProgressColor(storageInfo.usagePercent)}`}
              style={{ width: `${storageInfo.usagePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={getStorageUsageTextColor(storageInfo.usagePercent)}>
              {storageInfo.usagePercent}% used
            </span>
            <span className="text-text-muted">
              {storageInfo.imageCount} {storageInfo.imageCount === 1 ? "image" : "images"}
            </span>
          </div>

          {storageInfo.usagePercent >= 90 && (
            <div className="rounded-[--radius-md] border border-warning/20 bg-warning/5 px-3 py-2.5">
              <p className="text-xs text-warning">
                You&apos;re running low on storage. Consider deleting old images to free up space.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-text-muted">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-sm">Loading storage info...</span>
        </div>
      )}
    </Card>
  );
}
