import type { R2Bucket } from "@cloudflare/workers-types";

export async function uploadFile(
  r2: R2Bucket,
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<void> {
  await r2.put(key, body, {
    httpMetadata: { contentType },
  });
}

export async function getFile(
  r2: R2Bucket,
  key: string
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const object = await r2.get(key);

  if (!object) return null;

  return {
    body: object.body,
    contentType: object.httpMetadata?.contentType || "application/octet-stream",
  };
}

export async function deleteFile(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}
