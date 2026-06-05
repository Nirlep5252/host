import { and, eq, isNull, or } from "drizzle-orm";
import { domains, users, type Database, type Domain } from "../db";
import { CloudflareAPI } from "./cloudflare";

export const FALLBACK_DOMAIN = "formality.life";

export type DomainVisibility = "private" | "public";

export type DomainStatus = {
  isConfigured: boolean;
  status: string;
  sslStatus: string;
};

export type UserDomain = {
  id: string;
  domain: string;
  isDefault: boolean;
  isOwner: boolean;
  visibility: string;
  isApproved: boolean;
} & DomainStatus;

export function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim();
}

export function domainFromBaseUrl(baseUrl?: string): string {
  return baseUrl?.replace(/^https?:\/\//, "") || FALLBACK_DOMAIN;
}

function isBuiltInDomain(
  domain: Pick<Domain, "isDefault" | "isWorkerDomain">
): boolean {
  return domain.isDefault || domain.isWorkerDomain;
}

export function canUserUseDomain(
  domain: Pick<Domain, "ownerId" | "visibility" | "isApproved">,
  userId: string
): boolean {
  return (
    domain.ownerId === null ||
    domain.ownerId === userId ||
    (domain.visibility === "public" && domain.isApproved)
  );
}

export async function resolveDomainStatus(
  domain: Pick<
    Domain,
    "domain" | "isDefault" | "isWorkerDomain" | "cloudflareHostnameId"
  >,
  cloudflare: CloudflareAPI
): Promise<DomainStatus> {
  if (isBuiltInDomain(domain)) {
    return { isConfigured: true, status: "active", sslStatus: "active" };
  }

  if (!domain.cloudflareHostnameId) {
    return {
      isConfigured: false,
      status: "not_registered",
      sslStatus: "not_registered",
    };
  }

  return cloudflare.checkHostnameStatus(domain.domain);
}

export async function getAvailableDomainsForUser(
  db: Database,
  cloudflare: CloudflareAPI,
  userId: string
): Promise<UserDomain[]> {
  const activeDomains = await db
    .select({
      id: domains.id,
      domain: domains.domain,
      isDefault: domains.isDefault,
      isWorkerDomain: domains.isWorkerDomain,
      cloudflareHostnameId: domains.cloudflareHostnameId,
      ownerId: domains.ownerId,
      visibility: domains.visibility,
      isApproved: domains.isApproved,
    })
    .from(domains)
    .where(
      and(
        eq(domains.isActive, true),
        or(
          isNull(domains.ownerId),
          eq(domains.ownerId, userId),
          and(eq(domains.visibility, "public"), eq(domains.isApproved, true))
        )
      )
    );

  const domainsWithStatus = await Promise.all(
    activeDomains.map(async (domain) => {
      const isOwner = domain.ownerId === userId;
      if (isOwner && !isBuiltInDomain(domain) && !domain.cloudflareHostnameId) {
        return {
          id: domain.id,
          domain: domain.domain,
          isDefault: domain.isDefault,
          isOwner,
          visibility: domain.visibility,
          isApproved: domain.isApproved,
          isConfigured: false,
          status: "pending",
          sslStatus: "pending",
        };
      }

      const status = await resolveDomainStatus(domain, cloudflare);

      if (!status.isConfigured && !isOwner) {
        return null;
      }

      return {
        id: domain.id,
        domain: domain.domain,
        isDefault: domain.isDefault,
        isOwner,
        visibility: domain.visibility,
        isApproved: domain.isApproved,
        ...status,
      };
    })
  );

  return domainsWithStatus.filter(
    (domain): domain is UserDomain => domain !== null
  );
}

export async function getPreferredDomainName(
  db: Database,
  userId: string,
  fallbackDomain = FALLBACK_DOMAIN
): Promise<string> {
  const [user] = await db
    .select({ domainId: users.domainId })
    .from(users)
    .where(eq(users.id, userId));

  if (user?.domainId) {
    const [selectedDomain] = await db
      .select({ domain: domains.domain })
      .from(domains)
      .where(eq(domains.id, user.domainId));

    if (selectedDomain?.domain) {
      return selectedDomain.domain;
    }
  }

  const [defaultDomain] = await db
    .select({ domain: domains.domain })
    .from(domains)
    .where(eq(domains.isDefault, true));

  return defaultDomain?.domain ?? fallbackDomain;
}

export async function validateDomainSelection(
  db: Database,
  cloudflare: CloudflareAPI,
  userId: string,
  domainId: string
): Promise<{ ok: true } | { ok: false; status: 400 | 403; error: string }> {
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.isActive, true)));

  if (!domain) {
    return { ok: false, status: 400, error: "Domain not found or inactive" };
  }

  if (!canUserUseDomain(domain, userId)) {
    return { ok: false, status: 403, error: "You don't have access to this domain" };
  }

  const status = await resolveDomainStatus(domain, cloudflare);
  if (!status.isConfigured) {
    return {
      ok: false,
      status: 400,
      error:
        "Domain is not fully configured. Please wait for SSL certificate to be issued.",
    };
  }

  return { ok: true };
}
