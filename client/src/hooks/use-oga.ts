import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  OgaSite,
  OgaAsset,
  OgaSiteListResponse,
  OgaSiteDetailResponse,
} from "@shared/types";
import type { InsertOgaSite, UpdateOgaSite, UpsertOgaAssets } from "@shared/validators";

export function useOgaSites() {
  return useQuery({
    queryKey: ["oga-sites"],
    queryFn: () => apiClient.get<OgaSiteListResponse>("/oga/sites"),
  });
}

export function useOgaSite(id: number | null) {
  return useQuery({
    queryKey: ["oga-sites", id],
    queryFn: () =>
      apiClient.get<OgaSiteDetailResponse>(`/oga/sites/${id}`),
    enabled: !!id,
  });
}

export function useCreateOgaSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertOgaSite) =>
      apiClient.post<{ site: OgaSite }>("/oga/sites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oga-sites"] });
    },
  });
}

export function useUpdateOgaSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOgaSite }) =>
      apiClient.patch<{ site: OgaSite }>(`/oga/sites/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["oga-sites"] });
      queryClient.invalidateQueries({
        queryKey: ["oga-sites", variables.id],
      });
    },
  });
}

export function useDeleteOgaSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ success: boolean }>(`/oga/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oga-sites"] });
    },
  });
}

export function useRegenerateOgaKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ site: OgaSite }>(`/oga/sites/${id}/regenerate-key`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["oga-sites", id] });
    },
  });
}

export function useEmancipateOgaSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<{ site: OgaSite }>(`/oga/sites/${id}/emancipate`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["oga-sites"] });
      queryClient.invalidateQueries({ queryKey: ["oga-sites", id] });
    },
  });
}

export function useUpsertOgaAssets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      siteId,
      data,
    }: {
      siteId: number;
      data: UpsertOgaAssets;
    }) =>
      apiClient.post<{ assets: OgaAsset[] }>(
        `/oga/sites/${siteId}/assets`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["oga-sites", variables.siteId],
      });
    },
  });
}

export function useDeleteOgaAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      siteId,
      assetId,
    }: {
      siteId: number;
      assetId: number;
    }) =>
      apiClient.delete<{ success: boolean }>(
        `/oga/sites/${siteId}/assets/${assetId}`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["oga-sites", variables.siteId],
      });
    },
  });
}
