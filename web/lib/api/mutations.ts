import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_BASE_URL } from "./client";
import { imageKeys } from "./queries";
import type { UploadResponse, UpdateImageResponse, DeleteImageResponse } from "./types";

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }

      const uploadResponse: UploadResponse = await response.json();
      return uploadResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
    },
  });
}

export function useUpdateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isPrivate,
    }: {
      id: string;
      isPrivate: boolean;
    }) => {
      return apiClient<UpdateImageResponse>(`/i/${id}`, {
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

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<DeleteImageResponse>(`/i/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: imageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: imageKeys.detail(id) });
    },
  });
}
