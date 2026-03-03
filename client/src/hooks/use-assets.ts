import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Asset, AssetListResponse } from "@shared/types";

export function useAssets(filters?: {
  projectId?: number;
  category?: string;
}) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: () =>
      apiClient.get<AssetListResponse>("/assets", filters as any),
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      projectId,
      category,
    }: {
      file: File;
      projectId?: number;
      category?: string;
    }) => {
      const buffer = await file.arrayBuffer();
      const response = await fetch("/api/assets/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-Filename": file.name,
          ...(projectId ? { "X-Project-Id": String(projectId) } : {}),
          ...(category ? { "X-Category": category } : {}),
        },
        body: buffer,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json() as Promise<{ asset: Asset }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ success: boolean }>(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
