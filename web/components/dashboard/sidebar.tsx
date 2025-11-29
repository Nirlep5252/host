"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import * as motion from "motion/react-client";

const navItems = [
  {
    label: "Gallery",
    href: "/dashboard",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const adminNavItems = [
  {
    label: "Users",
    href: "/dashboard/admin",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 19.5C3 16.4624 5.46243 14 8.5 14H9.5C12.5376 14 15 16.4624 15 19.5V20H3V19.5Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 20V19.5C21 17.567 19.433 16 17.5 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function NavItem({
  item,
  isActive
}: {
  item: { label: string; href: string; icon: React.ReactNode };
  isActive: boolean;
}) {
  return (
    <Link href={item.href} className="block">
      <motion.div
        className={`group relative flex items-center gap-3 rounded-[--radius-md] px-3 py-2.5 transition-colors duration-200 ${
          isActive
            ? "text-accent"
            : "text-text-secondary hover:text-text-primary"
        }`}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 rounded-[--radius-md] bg-accent-muted"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        {/* Hover background */}
        <div className={`absolute inset-0 rounded-[--radius-md] bg-bg-hover opacity-0 transition-opacity duration-200 ${
          !isActive ? "group-hover:opacity-100" : ""
        }`} />

        {/* Content */}
        <span className="relative z-10">{item.icon}</span>
        <span className="relative z-10 text-sm font-medium">{item.label}</span>
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border-subtle bg-bg-secondary/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="group flex items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[--radius-md] bg-accent/10 transition-colors duration-200 group-hover:bg-accent/20">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
              <path d="M8 10l2.5 3L14 9l4 5H6l2-4z" fill="var(--bg-secondary)" />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight">
            <span className="text-text-primary">formality</span>
            <span className="text-accent">.life</span>
          </span>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Content
          </span>
        </div>

        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}

        {isAdmin && (
          <>
            <div className="pb-2 pt-5">
              <div className="mx-3 h-px bg-gradient-to-r from-border-subtle via-border-default to-border-subtle" />
            </div>

            <div className="mb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Admin
              </span>
            </div>

            {adminNavItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-subtle p-3">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-[--radius-md] px-3 py-2.5 text-text-muted transition-all duration-200 hover:bg-error-muted hover:text-error"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
