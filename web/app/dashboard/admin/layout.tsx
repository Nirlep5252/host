"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminTokenDialog } from "@/components/dashboard/admin-token-dialog";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, adminKey, isLoading } = useAuth();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAdmin && !adminKey) {
      setShowDialog(true);
    } else if (adminKey) {
      setShowDialog(false);
    }
  }, [isAdmin, adminKey, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (showDialog) {
    return <AdminTokenDialog onSuccess={() => setShowDialog(false)} />;
  }

  return <>{children}</>;
}
