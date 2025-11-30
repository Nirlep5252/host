"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDomainsQuery, adminClient } from "@/lib/api";
import { useToast, Button, Input, Badge, Card } from "@/components/ui";
import * as motion from "motion/react-client";
import { fadeInUp, fadeIn, transition } from "@/lib/motion";

interface DomainStatus {
  id: string;
  domain: string;
  isDefault: boolean;
  isActive: boolean;
  isConfigured: boolean;
  status: string;
  sslStatus: string;
  createdAt: string;
  ownerId: string | null;
  ownerEmail: string | null;
  visibility: string;
  isApproved: boolean;
}

function getStatusInfo(domain: DomainStatus): {
  color: string;
  label: string;
  description: string;
  showSetup: boolean;
} {
  if (domain.isDefault) {
    return { color: "bg-success", label: "Active", description: "Default domain", showSetup: false };
  }

  if (domain.status === "active" && domain.sslStatus === "active") {
    return { color: "bg-success", label: "Active", description: "Fully configured", showSetup: false };
  }

  if (domain.status === "active" && domain.sslStatus === "pending_validation") {
    return { color: "bg-accent", label: "SSL Pending", description: "DNS verified, SSL certificate being issued", showSetup: false };
  }

  if (domain.status === "pending") {
    return { color: "bg-warning", label: "Pending", description: "Waiting for DNS verification", showSetup: true };
  }

  if (domain.status === "not_registered") {
    return { color: "bg-error", label: "Not Registered", description: "Domain not registered with Cloudflare", showSetup: true };
  }

  return { color: "bg-warning", label: "Pending", description: `Status: ${domain.status}, SSL: ${domain.sslStatus}`, showSetup: true };
}

export default function DomainsPage() {
  const { adminKey, clearAdminKey } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newDomain, setNewDomain] = useState("");
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);

  const { data: domainsData, isLoading, error } = useQuery(
    adminDomainsQuery(adminKey || "")
  );

  const handleCreateDomain = async () => {
    if (!newDomain.trim() || !adminKey) return;
    setIsCreatingDomain(true);
    try {
      await adminClient("/admin/domains", adminKey, {
        method: "POST",
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      setNewDomain("");
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      toast("Domain created successfully");
    } catch {
      toast("Failed to create domain");
    } finally {
      setIsCreatingDomain(false);
    }
  };

  const handleSetDefault = async (domainId: string) => {
    if (!adminKey) return;
    try {
      await adminClient(`/admin/domains/${domainId}`, adminKey, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      toast("Default domain updated");
    } catch {
      toast("Failed to update domain");
    }
  };

  const handleToggleActive = async (domainId: string, isActive: boolean) => {
    if (!adminKey) return;
    try {
      await adminClient(`/admin/domains/${domainId}`, adminKey, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      toast(`Domain ${isActive ? "disabled" : "enabled"}`);
    } catch {
      toast("Failed to update domain");
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!adminKey) return;
    if (!confirm(`Are you sure you want to delete "${domainName}"?`)) return;
    try {
      await adminClient(`/admin/domains/${domainId}`, adminKey, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      toast("Domain deleted");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete domain";
      toast(message);
    }
  };

  const handleApprove = async (domainId: string, approve: boolean) => {
    if (!adminKey) return;
    try {
      await adminClient(`/admin/domains/${domainId}`, adminKey, {
        method: "PATCH",
        body: JSON.stringify({ isApproved: approve }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "domains"] });
      toast(approve ? "Domain approved" : "Domain approval revoked");
    } catch {
      toast("Failed to update domain approval");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
            Domains
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage domains for image URLs
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={clearAdminKey}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Lock
        </Button>
      </div>

      {isLoading ? (
        <motion.div
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={transition.fast}
          className="space-y-3"
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[--radius-md] bg-bg-tertiary"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </motion.div>
      ) : error ? (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.normal}
          className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-error/20 bg-error/5 py-20"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10">
            <svg className="h-7 w-7 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-medium text-error">Failed to load domains</p>
          <p className="mt-1 text-sm text-text-muted">Check your admin key and try again</p>
        </motion.div>
      ) : (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.normal}
          className="space-y-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Domain</h3>
            <div className="flex gap-3">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDomain()}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleCreateDomain}
                disabled={!newDomain.trim() || isCreatingDomain}
              >
                {isCreatingDomain ? "Adding..." : "Add Domain"}
              </Button>
            </div>
          </Card>

          {domainsData?.domains?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-16">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
                <svg className="h-6 w-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <p className="font-medium text-text-primary">No domains configured</p>
              <p className="mt-1 text-sm text-text-muted">Add your first domain above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domainsData?.domains?.map((domain) => {
                const statusInfo = getStatusInfo(domain as DomainStatus);
                const typedDomain = domain as DomainStatus;
                const isUserDomain = typedDomain.ownerId !== null;
                const needsApproval = isUserDomain && typedDomain.visibility === "public" && !typedDomain.isApproved;
                return (
                  <Card key={domain.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${statusInfo.color}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary">{domain.domain}</span>
                            {domain.isDefault && (
                              <Badge variant="accent">Default</Badge>
                            )}
                            {!domain.isActive && (
                              <Badge variant="warning">Disabled</Badge>
                            )}
                            <Badge variant={statusInfo.color === "bg-success" ? "success" : statusInfo.color === "bg-accent" ? "accent" : "warning"}>
                              {statusInfo.label}
                            </Badge>
                            {isUserDomain && (
                              <Badge variant={typedDomain.visibility === "private" ? "default" : "accent"}>
                                {typedDomain.visibility === "private" ? "Private" : "Public"}
                              </Badge>
                            )}
                            {needsApproval && (
                              <Badge variant="warning">Pending Approval</Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {isUserDomain ? (
                              <>Owner: <span className="text-text-secondary">{typedDomain.ownerEmail}</span> &middot; </>
                            ) : (
                              <>Owner: <span className="text-accent">Admin</span> &middot; </>
                            )}
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "domains"] })}
                          title="Refresh status"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                        {needsApproval && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(domain.id, true)}
                          >
                            Approve
                          </Button>
                        )}
                        {isUserDomain && typedDomain.visibility === "public" && typedDomain.isApproved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(domain.id, false)}
                          >
                            Revoke
                          </Button>
                        )}
                        {!domain.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(domain.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(domain.id, domain.isActive)}
                        >
                          {domain.isActive ? "Disable" : "Enable"}
                        </Button>
                        {!domain.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id, domain.domain)}
                            className="text-error hover:text-error"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    {statusInfo.showSetup && (
                      <div className="mt-4 rounded-[--radius-md] bg-warning/10 p-3 text-sm">
                        <p className="font-medium text-warning mb-1">DNS Setup Required</p>
                        <p className="text-text-muted text-xs">
                          Add a CNAME record pointing <code className="bg-bg-tertiary px-1 rounded">{domain.domain}</code> to{" "}
                          <code className="bg-bg-tertiary px-1 rounded">formality.life</code>. SSL certificate will be issued automatically once DNS is verified.
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
