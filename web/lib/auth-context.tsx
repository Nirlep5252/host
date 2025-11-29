"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userQuery, adminClient } from "./api";
import type { User } from "./api";

const STORAGE_KEY = "host_api_key";
const ADMIN_STORAGE_KEY = "host_admin_key";

interface AuthContextType {
  apiKey: string | null;
  adminKey: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
  setAdminKey: (adminKey: string) => Promise<void>;
  clearAdminKey: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [adminKey, setAdminKeyState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedApiKey = localStorage.getItem(STORAGE_KEY);
    const storedAdminKey = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedAdminKey) {
      setAdminKeyState(storedAdminKey);
    }
    setIsInitialized(true);
  }, []);

  const {
    data: user,
    isLoading: isUserLoading,
    error: queryError,
  } = useQuery({
    ...userQuery(apiKey || ""),
    enabled: !!apiKey && isInitialized,
    retry: false,
  });

  useEffect(() => {
    if (queryError && apiKey) {
      localStorage.removeItem(STORAGE_KEY);
      setApiKey(null);
      setLoginError("Invalid API key");
    }
  }, [queryError, apiKey]);

  const login = useCallback(async (newApiKey: string) => {
    setLoginError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://formality.life"}/me`,
        {
          headers: { "X-API-Key": newApiKey },
        }
      );

      if (!response.ok) {
        throw new Error("Invalid API key");
      }

      localStorage.setItem(STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch {
      setLoginError("Invalid API key");
      throw new Error("Invalid API key");
    }
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setApiKey(null);
    setAdminKeyState(null);
    setLoginError(null);
    queryClient.clear();
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

  const isLoading = !isInitialized || (!!apiKey && isUserLoading);
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        adminKey,
        user: user ?? null,
        isLoading,
        isAuthenticated: !!apiKey && !!user,
        isAdmin,
        login,
        logout,
        setAdminKey,
        clearAdminKey,
        error: loginError,
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
