"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { adminUsersQuery, adminWaitlistQuery } from "@/lib/api";
import { useToast, Button } from "@/components/ui";
import { UserTable } from "@/components/dashboard/admin/user-table";
import { WaitlistTable } from "@/components/dashboard/admin/waitlist-table";
import { CreateUserDialog } from "@/components/dashboard/admin/create-user-dialog";
import * as motion from "motion/react-client";
import { fadeInUp, fadeIn, transition } from "@/lib/motion";

type Tab = "users" | "waitlist";

export default function AdminPage() {
  const { adminKey, clearAdminKey } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [waitlistFilter, setWaitlistFilter] = useState<string | undefined>(undefined);

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    adminUsersQuery(adminKey || "")
  );

  const { data: waitlistData, isLoading: waitlistLoading, error: waitlistError } = useQuery(
    adminWaitlistQuery(adminKey || "", waitlistFilter)
  );

  const handleCopyKey = () => {
    toast("API key copied to clipboard");
  };

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    if (!searchQuery.trim()) return usersData.users;

    const query = searchQuery.toLowerCase();
    return usersData.users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query)
    );
  }, [usersData?.users, searchQuery]);

  const filteredWaitlist = useMemo(() => {
    if (!waitlistData?.entries) return [];
    if (!searchQuery.trim()) return waitlistData.entries;

    const query = searchQuery.toLowerCase();
    return waitlistData.entries.filter(
      (entry) =>
        entry.email.toLowerCase().includes(query) ||
        entry.name?.toLowerCase().includes(query) ||
        entry.reason?.toLowerCase().includes(query)
    );
  }, [waitlistData?.entries, searchQuery]);

  const totalUsers = usersData?.users.length ?? 0;
  const activeUsers = usersData?.users.filter((u) => u.isActive).length ?? 0;

  const isLoading = activeTab === "users" ? usersLoading : waitlistLoading;
  const error = activeTab === "users" ? usersError : waitlistError;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text-primary">
            Admin
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage users and waitlist
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

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-6 border-b border-border-subtle">
        <button
          onClick={() => {
            setActiveTab("users");
            setSearchQuery("");
          }}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "text-accent"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Users
          <span className="ml-2 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs">
            {totalUsers}
          </span>
          {activeTab === "users" && (
            <motion.div
              layoutId="adminTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("waitlist");
            setSearchQuery("");
          }}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "waitlist"
              ? "text-accent"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Waitlist
          {waitlistData?.stats.pending ? (
            <span className="ml-2 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
              {waitlistData.stats.pending}
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs">
              {waitlistData?.entries.length ?? 0}
            </span>
          )}
          {activeTab === "waitlist" && (
            <motion.div
              layoutId="adminTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
            />
          )}
        </button>
      </div>

      {/* Waitlist Stats & Filter */}
      {activeTab === "waitlist" && waitlistData?.stats && (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.fast}
          className="mb-6 flex items-center gap-3"
        >
          <button
            onClick={() => setWaitlistFilter(undefined)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !waitlistFilter
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-muted hover:bg-bg-hover hover:text-text-secondary"
            }`}
          >
            All ({waitlistData.stats.pending + waitlistData.stats.approved + waitlistData.stats.rejected})
          </button>
          <button
            onClick={() => setWaitlistFilter("pending")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              waitlistFilter === "pending"
                ? "bg-warning text-black"
                : "bg-warning/10 text-warning hover:bg-warning/20"
            }`}
          >
            Pending ({waitlistData.stats.pending})
          </button>
          <button
            onClick={() => setWaitlistFilter("approved")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              waitlistFilter === "approved"
                ? "bg-success text-black"
                : "bg-success/10 text-success hover:bg-success/20"
            }`}
          >
            Approved ({waitlistData.stats.approved})
          </button>
          <button
            onClick={() => setWaitlistFilter("rejected")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              waitlistFilter === "rejected"
                ? "bg-error text-white"
                : "bg-error/10 text-error hover:bg-error/20"
            }`}
          >
            Rejected ({waitlistData.stats.rejected})
          </button>
        </motion.div>
      )}

      {/* Users Tab Stats */}
      {activeTab === "users" && !usersLoading && !usersError && totalUsers > 0 && (
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={transition.fast}
          className="mb-6"
        >
          <p className="text-sm text-text-muted">
            {activeUsers} active · {totalUsers - activeUsers} inactive
          </p>
        </motion.div>
      )}

      {/* Search */}
      {!isLoading && !error && (
        (activeTab === "users" && totalUsers > 0) ||
        (activeTab === "waitlist" && (waitlistData?.entries.length ?? 0) > 0)
      ) && (
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
              placeholder={
                activeTab === "users"
                  ? "Search by email or name..."
                  : "Search by email, name, or reason..."
              }
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

      {/* Content */}
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
          <p className="font-medium text-error">Failed to load {activeTab}</p>
          <p className="mt-1 text-sm text-text-muted">Check your admin key and try again</p>
        </motion.div>
      ) : activeTab === "users" ? (
        usersData?.users.length === 0 ? (
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
        )
      ) : (
        waitlistData?.entries.length === 0 ? (
          <motion.div
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={transition.normal}
            className="flex flex-col items-center justify-center rounded-[--radius-lg] border border-dashed border-border-default py-24"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary">
              <svg className="h-8 w-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-[family-name:var(--font-display)] text-lg font-medium text-text-primary">
              No waitlist entries
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {waitlistFilter
                ? `No ${waitlistFilter} entries found`
                : "When users join the waitlist, they'll appear here"}
            </p>
          </motion.div>
        ) : filteredWaitlist.length === 0 ? (
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
          <WaitlistTable entries={filteredWaitlist} onCopyKey={handleCopyKey} />
        )
      )}

      <CreateUserDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
