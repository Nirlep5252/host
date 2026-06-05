import { nanoid } from "nanoid";
import { apiKeys, type Database } from "../db";

export function generateApiKey(): string {
  return `sk_${nanoid(32)}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKeyForUser(
  db: Database,
  userId: string,
  name: string
): Promise<string> {
  const apiKey = generateApiKey();
  const keyHash = await hashApiKey(apiKey);

  await db.insert(apiKeys).values({
    userId,
    name,
    keyHash,
    keyPrefix: apiKey.slice(0, 7),
  });

  return apiKey;
}
