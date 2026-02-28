import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  SharedDoc,
  SharedDocListResponse,
  ReorderDocsResponse,
} from "../../../shared/types";
import type { InsertSharedDoc, UpdateSharedDoc } from "../../../shared/validators";

export function useSharedDocs() {
  return useQuery({
    queryKey: ["shared-docs"],
    queryFn: () => apiClient.get<SharedDocListResponse>("/docs/shared"),
  });
}

export function useSharedDoc(id: number) {
  return useQuery({
    queryKey: ["shared-docs", id],
    queryFn: () => apiClient.get<{ doc: SharedDoc }>(`/docs/shared/${id}`),
    enabled: !!id,
  });
}

export function useCreateSharedDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSharedDoc) =>
      apiClient.post<{ doc: SharedDoc }>("/docs/shared", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-docs"] });
    },
  });
}

export function useUpdateSharedDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSharedDoc }) =>
      apiClient.put<{ doc: SharedDoc }>(`/docs/shared/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shared-docs"] });
      queryClient.invalidateQueries({ queryKey: ["shared-docs", variables.id] });
    },
  });
}

export function useDeleteSharedDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ success: boolean }>(`/docs/shared/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-docs"] });
    },
  });
}

export function useReorderSharedDocs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docIds: number[]) =>
      apiClient.post<ReorderDocsResponse>("/docs/shared/reorder", { docIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-docs"] });
    },
  });
}
