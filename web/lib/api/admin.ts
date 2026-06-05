import { useQueryClient, useMutation, queryOptions } from "@tanstack/react-query";
import { ApiError, API_BASE_URL } from "./client";
import type {
  AdminUser,
  AdminUsersResponse,
  AdminCreateUserRequest,
  AdminCreateUserResponse,
  AdminDeleteUserResponse,
  AdminCreateKeyResponse,
  AdminWaitlistResponse,
  AdminApproveWaitlistResponse,
  AdminRejectWaitlistResponse,
  AdminDeleteWaitlistResponse,
  AdminDomainsResponse,
} from "./types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

export async function adminClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const requestHeaders: Record<string, string> = { ...headers };

  if (typeof body === "string" && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    body,
    credentials: "include",
    headers: requestHeaders,
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
  waitlist: () => [...adminKeys.all, "waitlist"] as const,
  domains: () => [...adminKeys.all, "domains"] as const,
};

export function adminUsersQuery() {
  return queryOptions({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      return adminClient<AdminUsersResponse>("/admin/users");
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdminCreateUserRequest) => {
      return adminClient<AdminCreateUserResponse>("/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminClient<AdminDeleteUserResponse>(`/admin/users/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminCreateKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return adminClient<AdminCreateKeyResponse>(
        `/admin/users/${userId}/create-key`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      storageLimitBytes,
      role,
    }: {
      userId: string;
      storageLimitBytes?: number | null;
      role?: "user" | "admin";
    }) => {
      return adminClient<{ user: AdminUser }>(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ storageLimitBytes, role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function adminWaitlistQuery(status?: string) {
  return queryOptions({
    queryKey: [...adminKeys.waitlist(), status],
    queryFn: async () => {
      const endpoint = status
        ? `/admin/waitlist?status=${status}`
        : "/admin/waitlist";
      return adminClient<AdminWaitlistResponse>(endpoint);
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminApproveWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      return adminClient<AdminApproveWaitlistResponse>(
        `/admin/waitlist/${entryId}/approve`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.waitlist() });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useAdminRejectWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      return adminClient<AdminRejectWaitlistResponse>(
        `/admin/waitlist/${entryId}/reject`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.waitlist() });
    },
  });
}

export function useAdminDeleteWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      return adminClient<AdminDeleteWaitlistResponse>(
        `/admin/waitlist/${entryId}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.waitlist() });
    },
  });
}

export function adminDomainsQuery() {
  return queryOptions({
    queryKey: adminKeys.domains(),
    queryFn: async () => {
      return adminClient<AdminDomainsResponse>("/admin/domains");
    },
    staleTime: 30 * 1000,
  });
}
