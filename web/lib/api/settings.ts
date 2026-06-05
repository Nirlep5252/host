import type { ApiKeyInfo } from "@/lib/auth-context";

export type DomainVisibility = "private" | "public";

export interface UserDomain {
  id: string;
  domain: string;
  isDefault: boolean;
  isOwner?: boolean;
  visibility?: string;
  isApproved?: boolean;
  isConfigured?: boolean;
  status?: string;
  sslStatus?: string;
}

export const settingsKeys = {
  apiKeys: ["api-keys"] as const,
  domains: ["user-domains"] as const,
};

const FALLBACK_DOMAINS: UserDomain[] = [
  { id: "default", domain: "formality.life", isDefault: true },
];

async function parseError(response: Response, fallback: string): Promise<Error> {
  const data = await response.json().catch(() => null);
  return new Error(data?.error || fallback);
}

export async function fetchApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await fetch("/me/api-keys", { credentials: "include" });
  if (!response.ok) throw await parseError(response, "Failed to fetch API keys");

  const data = await response.json();
  return data.keys ?? [];
}

export async function fetchUserDomains(): Promise<UserDomain[]> {
  const response = await fetch("/me/domains", { credentials: "include" });
  if (!response.ok) throw await parseError(response, "Failed to fetch domains");

  const data = await response.json();
  const domains: UserDomain[] = data.domains ?? [];
  return domains.length === 0 ? FALLBACK_DOMAINS : domains;
}

export async function updateSelectedDomain(domainId: string): Promise<void> {
  const response = await fetch("/me/domain", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domainId }),
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to update domain");
  }
}

export async function createUserDomain(input: {
  domain: string;
  visibility: DomainVisibility;
}): Promise<void> {
  const response = await fetch("/me/domains", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: input.domain.trim().toLowerCase(),
      visibility: input.visibility,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to add domain");
  }
}

export async function deleteUserDomain(domainId: string): Promise<void> {
  const response = await fetch(`/me/domains/${domainId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to delete domain");
  }
}
