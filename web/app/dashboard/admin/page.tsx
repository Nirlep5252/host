"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { adminUsersQuery } from "@/lib/api";
import { useToast, Button } from "@/components/ui";
import { UserTable } from "@/components/dashboard/admin/user-table";
import { CreateUserDialog } from "@/components/dashboard/admin/create-user-dialog";
import * as motion from "motion/react-client";
import { fadeInUp, fadeIn, transition } from "@/lib/motion";

export default function AdminPage() {
  const { adminKey, clearAdminKey } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery(adminUsersQuery(adminKey || ""));

  const handleCopyKey = () => {
    toast("API key copied to clipboard");
  };

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (!searchQuery.trim()) return data.users;

    const query = searchQuery.toLowerCase();
    return data.users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query)
    );
  }, [data?.users, searchQuery]);

  const totalUsers = data?.users.length ?? 0;
  const activeUsers = data?.users.filter((u) => u.isActive).length ?? 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
            Users
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {totalUsers} {totalUsers === 1 ? "user" : "users"} · {activeUsers} active
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAdminKey}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Lock
          </Button>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create User
          </Button>
        </div>
      </div>

      {/* Search */}
      {!isLoading && !error && totalUsers > 0 && (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.normal}
          className="mb-6"
        >
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full rounded-[--radius-md] border border-border-default bg-bg-secondary py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* User List */}
      {isLoading ? (
        <motion.div
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={transition.fast}
          className="space-y-2"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-[--radius-md] bg-bg-tertiary"
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
          <p className="font-medium text-error">Failed to load users</p>
          <p className="mt-1 text-sm text-text-muted">Check your admin key and try again</p>
        </motion.div>
      ) : data?.users.length === 0 ? (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.normal}
          className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-24"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary">
            <svg className="h-8 w-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="font-[family-name:var(--font-display)] text-lg font-medium text-text-primary">
            No users yet
          </p>
          <p className="mt-1 text-sm text-text-muted">Create your first user to get started</p>
          <Button variant="primary" className="mt-6" onClick={() => setIsCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create User
          </Button>
        </motion.div>
      ) : filteredUsers.length === 0 ? (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.normal}
          className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-16"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
            <svg className="h-6 w-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="font-medium text-text-primary">No results found</p>
          <p className="mt-1 text-sm text-text-muted">Try a different search term</p>
        </motion.div>
      ) : (
        <UserTable users={filteredUsers} onCopyKey={handleCopyKey} />
      )}

      <CreateUserDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
