"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ApiKeyRequiredModal } from "@/components/dashboard/api-key-required-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [dismissedApiKeyPromptForUser, setDismissedApiKeyPromptForUser] =
    useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const requiresApiKey = (user?.apiKeyCount ?? 0) === 0;
  const showApiKeyModal =
    !!user && requiresApiKey && dismissedApiKeyPromptForUser !== user.id;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
      <ApiKeyRequiredModal
        isOpen={showApiKeyModal}
        onComplete={() => setDismissedApiKeyPromptForUser(user?.id ?? null)}
      />
    </div>
  );
}
