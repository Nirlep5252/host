"use client";

import { ApiKeysCard } from "@/components/dashboard/settings/api-keys-card";
import { DomainSettingsSection } from "@/components/dashboard/settings/domain-settings-section";
import { StorageCard } from "@/components/dashboard/settings/storage-card";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-text-secondary">
          Manage your account settings and API keys
        </p>
      </div>

      <ApiKeysCard />
      <StorageCard user={user} />
      <DomainSettingsSection user={user} />
    </div>
  );
}
