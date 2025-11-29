"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui";

export function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-bg-primary/80 px-6 backdrop-blur-sm">
      <div />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 rounded-[--radius-sm] px-3 py-2 transition-colors hover:bg-bg-hover"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm text-text-secondary">
            {user?.email || "Loading..."}
          </span>
          <svg
            className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-[--radius-md] border border-border-default bg-bg-secondary p-1 shadow-lg">
            <div className="border-b border-border-subtle px-3 py-2">
              <p className="text-sm font-medium text-text-primary">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
            <div className="pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-text-secondary hover:text-error"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
