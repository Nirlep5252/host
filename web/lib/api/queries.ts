import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { User, ImagesListResponse } from "./types";

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const imageKeys = {
  all: ["images"] as const,
  lists: () => [...imageKeys.all, "list"] as const,
  list: (params: { limit?: number; offset?: number }) =>
    [...imageKeys.lists(), params] as const,
  detail: (id: string) => [...imageKeys.all, "detail", id] as const,
};

export function userQuery(apiKey: string) {
  return queryOptions({
    queryKey: userKeys.me(),
    queryFn: () => apiClient<User>("/me", apiKey),
    enabled: !!apiKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function imagesQuery(
  apiKey: string,
  params: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = params;

  return queryOptions({
    queryKey: imageKeys.list({ limit, offset }),
    queryFn: () =>
      apiClient<ImagesListResponse>(
        `/images/list?limit=${limit}&offset=${offset}`,
        apiKey
      ),
    enabled: !!apiKey,
    staleTime: 30 * 1000, // 30 seconds
  });
}
