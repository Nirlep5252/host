"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut as betterAuthSignOut } from "./auth-client";
import { adminClient } from "./api";

const API_KEY_STORAGE_KEY = "host_api_key";
const ADMIN_STORAGE_KEY = "host_admin_key";
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
  adminKey: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setAdminKey: (adminKey: string) => Promise<void>;
  clearAdminKey: () => void;
  createApiKey: (name: string) => Promise<string>;
  revokeApiKey: (id: string) => Promise<void>;
  setApiKey: (key: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [adminKey, setAdminKeyState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  const { data: session, isPending: isSessionLoading } = useSession();

  const { data: userDetails, isLoading: isUserDetailsLoading } = useQuery({
    queryKey: ["user-details"],
    queryFn: fetchUserDetails,
    enabled: !!session?.user,
    retry: false,
  });

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const storedAdminKey = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedApiKey) {
      setApiKeyState(storedApiKey);
    }
    if (storedAdminKey) {
      setAdminKeyState(storedAdminKey);
    }
    setIsInitialized(true);
  }, []);

  const user: User | null = userDetails || (session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt?.toString() || new Date().toISOString(),
        isAdmin: false,
      }
    : null);

  const logout = useCallback(async () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setApiKeyState(null);
    setAdminKeyState(null);
    queryClient.clear();
    await betterAuthSignOut();
  }, [queryClient]);

  const setAdminKey = useCallback(async (newAdminKey: string) => {
    try {
      await adminClient("/admin/users", newAdminKey);
      localStorage.setItem(ADMIN_STORAGE_KEY, newAdminKey);
      setAdminKeyState(newAdminKey);
    } catch {
      throw new Error("Invalid admin key");
    }
  }, []);

  const clearAdminKey = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminKeyState(null);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
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

    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKeyState(newKey);
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
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const isLoading = !isInitialized || isSessionLoading || (!!session?.user && isUserDetailsLoading);
  const isAuthenticated = !!session?.user;
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        adminKey,
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        logout,
        setAdminKey,
        clearAdminKey,
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
