"use client";

import { Badge, Button, Card } from "@/components/ui";
import type { UserDomain } from "@/lib/api/settings";
import { getDomainAlerts, getDomainStatus } from "./domain-status";
import { GlobeIcon, PlusIcon, RefreshIcon, TrashIcon, WarningIcon } from "./icons";

type CustomDomainsCardProps = {
  domains: UserDomain[];
  isRefreshing: boolean;
  deletingDomainId: string | null;
  onRefresh: () => void;
  onAddDomain: () => void;
  onDeleteDomain: (domainId: string) => void;
};

export function CustomDomainsCard({
  domains,
  isRefreshing,
  deletingDomainId,
  onRefresh,
  onAddDomain,
  onDeleteDomain,
}: CustomDomainsCardProps) {
  const myDomains = domains.filter((domain) => domain.isOwner);
  const alerts = getDomainAlerts(myDomains);

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">My Custom Domains</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Add your own domains for image URLs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh domain status"
          >
            <RefreshIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="secondary" onClick={onAddDomain}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>
      </div>

      {myDomains.length === 0 ? (
        <div className="rounded-[--radius-md] border border-dashed border-border-default p-8 text-center">
          <GlobeIcon className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <p className="font-medium text-text-secondary">No custom domains yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Add your own domain to use for image URLs
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myDomains.map((domain) => (
            <DomainRow
              key={domain.id}
              domain={domain}
              isDeleting={deletingDomainId === domain.id}
              onDelete={onDeleteDomain}
            />
          ))}
        </div>
      )}

      {(alerts.hasDnsPending || alerts.hasSslPending) && (
        <div className="mt-4 space-y-3">
          {alerts.hasDnsPending && (
            <DomainAlert
              tone="warning"
              title="DNS Configuration Required"
              description={
                <>
                  Add a CNAME record pointing your domain to{" "}
                  <code className="font-mono text-accent">formality.life</code>
                </>
              }
            />
          )}
          {alerts.hasSslPending && (
            <DomainAlert
              tone="accent"
              title="SSL Certificate Generating"
              description="Your DNS is configured correctly. SSL certificate is being generated, this usually takes a few minutes."
            />
          )}
        </div>
      )}
    </Card>
  );
}

type DomainRowProps = {
  domain: UserDomain;
  isDeleting: boolean;
  onDelete: (domainId: string) => void;
};

function DomainRow({ domain, isDeleting, onDelete }: DomainRowProps) {
  const status = getDomainStatus(domain);

  return (
    <div className="flex items-center justify-between rounded-[--radius-md] border border-border-default bg-bg-tertiary p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <GlobeIcon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="font-medium text-text-primary">{domain.domain}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={domain.visibility === "private" ? "default" : "accent"}>
              {domain.visibility === "private" ? "Private" : "Public"}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(domain.id)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
        ) : (
          <TrashIcon className="h-4 w-4 text-error" />
        )}
      </Button>
    </div>
  );
}

type DomainAlertProps = {
  tone: "warning" | "accent";
  title: string;
  description: React.ReactNode;
};

function DomainAlert({ tone, title, description }: DomainAlertProps) {
  const toneClass =
    tone === "warning"
      ? "border-warning/20 bg-warning/10 text-warning"
      : "border-accent/20 bg-accent/10 text-accent";

  return (
    <div className={`rounded-[--radius-md] border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <WarningIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </div>
  );
}
