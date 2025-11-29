import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "./client";
import { imageKeys } from "./queries";
import type { UploadResponse, UpdateImageResponse, DeleteImageResponse } from "./types";

export function useUploadImage(apiKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }

      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
    },
  });
}

export function useUpdateImage(apiKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isPrivate,
    }: {
      id: string;
      isPrivate: boolean;
    }) => {
      return apiClient<UpdateImageResponse>(`/i/${id}`, apiKey, {
        method: "PATCH",
        body: JSON.stringify({ isPrivate }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: imageKeys.detail(variables.id) });
    },
  });
}

export function useDeleteImage(apiKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<DeleteImageResponse>(`/i/${id}`, apiKey, {
        method: "DELETE",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: imageKeys.detail(id) });
    },
  });
}
