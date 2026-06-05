"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut as betterAuthSignOut } from "./auth-client";

const API_KEY_STORAGE_KEY = "host_api_key";
const AUTH_STORAGE_EVENT = "formality-auth-storage";
const API_BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  imageCount?: number;
  isAdmin?: boolean;
  apiKeyCount?: number;
  domain?: string | null;
  domainId?: string | null;
  storageBytes?: number;
  storageLimitBytes?: number;
  role?: "user" | "admin";
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface AuthContextType {
  apiKey: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  createApiKey: (name: string) => Promise<string>;
  revokeApiKey: (id: string) => Promise<void>;
  setApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readStorageKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function subscribeToAuthStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AUTH_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AUTH_STORAGE_EVENT, onStoreChange);
  };
}

function notifyAuthStorageChange() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

function setStorageKey(key: string, value: string) {
  localStorage.setItem(key, value);
  notifyAuthStorageChange();
}

function removeStorageKeys(...keys: string[]) {
  keys.forEach((key) => localStorage.removeItem(key));
  notifyAuthStorageChange();
}

async function fetchUserDetails(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user details");
  }
  return response.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const apiKey = useSyncExternalStore(
    subscribeToAuthStorage,
    () => readStorageKey(API_KEY_STORAGE_KEY),
    () => null
  );
  const queryClient = useQueryClient();

  const { data: session, isPending: isSessionLoading } = useSession();

  const { data: userDetails, isLoading: isUserDetailsLoading } = useQuery({
    queryKey: ["user-details"],
    queryFn: fetchUserDetails,
    enabled: !!session?.user,
    retry: false,
  });

  const user: User | null = userDetails || (session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt?.toString() || new Date().toISOString(),
        role: "user",
        isAdmin: false,
      }
    : null);

  const logout = useCallback(async () => {
    removeStorageKeys(API_KEY_STORAGE_KEY);
    queryClient.clear();
    await betterAuthSignOut();
  }, [queryClient]);

  const createApiKey = useCallback(async (name: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/me/api-keys`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create API key");
    }

    const data = await response.json();
    const newKey = data.apiKey;

    setStorageKey(API_KEY_STORAGE_KEY, newKey);
    queryClient.invalidateQueries({ queryKey: ["user-details"] });
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });

    return newKey;
  }, [queryClient]);

  const revokeApiKey = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/me/api-keys/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to revoke API key");
    }

    queryClient.invalidateQueries({ queryKey: ["user-details"] });
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });
  }, [queryClient]);

  const setApiKey = useCallback((key: string) => {
    setStorageKey(API_KEY_STORAGE_KEY, key);
  }, []);

  const isLoading = isSessionLoading || (!!session?.user && isUserDetailsLoading);
  const isAuthenticated = !!session?.user;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        logout,
        createApiKey,
        revokeApiKey,
        setApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
