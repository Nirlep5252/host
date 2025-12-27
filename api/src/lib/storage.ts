export const DEFAULT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

export function getEffectiveStorageLimit(
  storageLimitBytes: number | null
): number {
  return storageLimitBytes ?? DEFAULT_STORAGE_LIMIT_BYTES;
}
