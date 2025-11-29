import { useQueryClient, useMutation, queryOptions } from "@tanstack/react-query";
import { ApiError, API_BASE_URL } from "./client";
import type {
  AdminUser,
  AdminUsersResponse,
  AdminCreateUserRequest,
  AdminCreateUserResponse,
  AdminDeleteUserResponse,
  AdminRegenerateKeyResponse,
} from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

export async function adminClient<T>(
  endpoint: string,
  adminKey: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    body,
    headers: {
      "X-Admin-Key": adminKey,
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  return response.json();
}

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
};

export function adminUsersQuery(adminKey: string) {
  return queryOptions({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      return adminClient<AdminUsersResponse>("/admin/users", adminKey);
    },
    enabled: !!adminKey,
    staleTime: 30 * 1000,
  });
}

export function useAdminCreateUser(adminKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdminCreateUserRequest) => {
      return adminClient<AdminCreateUserResponse>("/admin/users", adminKey, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminDeleteUser(adminKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminClient<AdminDeleteUserResponse>(`/admin/users/${userId}`, adminKey, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminRegenerateKey(adminKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminClient<AdminRegenerateKeyResponse>(
        `/admin/users/${userId}/regenerate-key`,
        adminKey,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
