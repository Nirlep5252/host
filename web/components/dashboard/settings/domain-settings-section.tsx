"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/lib/auth-context";
import {
  createUserDomain,
  deleteUserDomain,
  fetchUserDomains,
  settingsKeys,
  updateSelectedDomain,
  type DomainVisibility,
} from "@/lib/api/settings";
import { AddDomainModal } from "./add-domain-modal";
import { CustomDomainsCard } from "./custom-domains-card";
import { UploadDomainCard } from "./upload-domain-card";

type DomainSettingsSectionProps = {
  user: User | null;
};

export function DomainSettingsSection({ user }: DomainSettingsSectionProps) {
  const queryClient = useQueryClient();
  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: settingsKeys.domains,
    queryFn: fetchUserDomains,
  });

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddDomainModalOpen, setIsAddDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainVisibility, setNewDomainVisibility] =
    useState<DomainVisibility>("private");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [addDomainError, setAddDomainError] = useState<string | null>(null);
  const [isDeletingDomain, setIsDeletingDomain] = useState<string | null>(null);
  const [isRefreshingDomains, setIsRefreshingDomains] = useState(false);

  useEffect(() => {
    if (domains.length === 0) return;

    const userDomainExists = domains.some(
      (domain) => domain.id === user?.domainId
    );
    const currentDomainExists = domains.some(
      (domain) => domain.id === selectedDomainId
    );
    const defaultDomain = domains.find((domain) => domain.isDefault);
    const nextDomainId =
      userDomainExists && user?.domainId
        ? user.domainId
        : defaultDomain?.id ?? domains[0].id;

    if (!currentDomainExists) {
      setSelectedDomainId(nextDomainId);
    }
  }, [domains, selectedDomainId, user?.domainId]);

  const refreshDomains = async () => {
    setIsRefreshingDomains(true);
    try {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.domains });
    } finally {
      setIsRefreshingDomains(false);
    }
  };

  const handleDomainChange = async (domainId: string) => {
    setIsDropdownOpen(false);
    if (domainId === selectedDomainId) return;

    setIsSavingDomain(true);
    setDomainError(null);
    try {
      await updateSelectedDomain(domainId);
      setSelectedDomainId(domainId);
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
    } catch {
      setDomainError("Failed to update domain. Please try again.");
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      setAddDomainError("Domain name is required");
      return;
    }

    setIsAddingDomain(true);
    setAddDomainError(null);
    try {
      await createUserDomain({
        domain: newDomainName,
        visibility: newDomainVisibility,
      });
      setNewDomainName("");
      setNewDomainVisibility("private");
      setIsAddDomainModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: settingsKeys.domains });
    } catch (err) {
      setAddDomainError(
        err instanceof Error ? err.message : "Failed to add domain"
      );
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain? This action cannot be undone.")) {
      return;
    }

    setIsDeletingDomain(domainId);
    try {
      await deleteUserDomain(domainId);

      if (selectedDomainId === domainId) {
        const remainingDomains = domains.filter((domain) => domain.id !== domainId);
        const defaultDomain = remainingDomains.find((domain) => domain.isDefault);
        setSelectedDomainId(defaultDomain?.id ?? null);
      }

      await queryClient.invalidateQueries({ queryKey: settingsKeys.domains });
      await queryClient.invalidateQueries({ queryKey: ["user-details"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete domain");
    } finally {
      setIsDeletingDomain(null);
    }
  };

  return (
    <>
      <UploadDomainCard
        domains={domains}
        selectedDomainId={selectedDomainId}
        isLoading={isLoadingDomains}
        isSaving={isSavingDomain}
        error={domainError}
        isDropdownOpen={isDropdownOpen}
        onDropdownOpenChange={setIsDropdownOpen}
        onSelectDomain={handleDomainChange}
      />

      <CustomDomainsCard
        domains={domains}
        isRefreshing={isRefreshingDomains}
        deletingDomainId={isDeletingDomain}
        onRefresh={refreshDomains}
        onAddDomain={() => setIsAddDomainModalOpen(true)}
        onDeleteDomain={handleDeleteDomain}
      />

      <AddDomainModal
        isOpen={isAddDomainModalOpen}
        domainName={newDomainName}
        visibility={newDomainVisibility}
        error={addDomainError}
        isSubmitting={isAddingDomain}
        onClose={() => setIsAddDomainModalOpen(false)}
        onDomainNameChange={setNewDomainName}
        onVisibilityChange={setNewDomainVisibility}
        onSubmit={handleAddDomain}
      />
    </>
  );
}
