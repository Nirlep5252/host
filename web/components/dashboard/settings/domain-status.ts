import type { UserDomain } from "@/lib/api/settings";

type BadgeVariant = "default" | "success" | "warning" | "error" | "accent";

export function getDomainStatus(domain: UserDomain): {
  label: string;
  variant: BadgeVariant;
} {
  if (domain.isConfigured) {
    if (domain.visibility === "public" && !domain.isApproved) {
      return { label: "Pending Approval", variant: "warning" };
    }
    return { label: "Active", variant: "success" };
  }

  const status = domain.status?.toLowerCase() || "";
  const sslStatus = domain.sslStatus?.toLowerCase() || "";

  if (status === "active" && sslStatus !== "active") {
    if (sslStatus === "pending_validation") {
      return { label: "SSL Validating", variant: "warning" };
    }
    if (sslStatus === "pending_issuance" || sslStatus === "pending_deployment") {
      return { label: "SSL Issuing", variant: "warning" };
    }
    return { label: "SSL Pending", variant: "warning" };
  }

  if (status === "pending") {
    return { label: "DNS Pending", variant: "warning" };
  }

  return { label: "Configure DNS", variant: "warning" };
}

export function getDomainAlerts(domains: UserDomain[]) {
  const pendingDomains = domains.filter((domain) => !domain.isConfigured);

  return {
    hasDnsPending: pendingDomains.some(
      (domain) => domain.status?.toLowerCase() === "pending" || !domain.status
    ),
    hasSslPending: pendingDomains.some(
      (domain) =>
        domain.status?.toLowerCase() === "active" &&
        domain.sslStatus?.toLowerCase() !== "active"
    ),
  };
}
