"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userQuery } from "./api";
import type { User } from "./api";

const STORAGE_KEY = "host_api_key";

interface AuthContextType {
  apiKey: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
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
    setApiKey(null);
    setLoginError(null);
    queryClient.clear();
  }, [queryClient]);

  const isLoading = !isInitialized || (!!apiKey && isUserLoading);

  return (
    <AuthContext.Provider
      value={{
        apiKey,
        user: user ?? null,
        isLoading,
        isAuthenticated: !!apiKey && !!user,
        login,
        logout,
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
