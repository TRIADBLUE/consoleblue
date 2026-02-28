import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  DocAssemblyPreview,
  DocPushResponse,
  DocPushHistoryResponse,
} from "../../../shared/types";

export function useDocPreview(projectSlug: string) {
  return useQuery({
    queryKey: ["doc-preview", projectSlug],
    queryFn: () =>
      apiClient.get<DocAssemblyPreview>(
        `/projects/${projectSlug}/docs/push/preview`,
      ),
    enabled: !!projectSlug,
  });
}

export function useDocPush(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options?: { targetPath?: string; commitMessage?: string }) =>
      apiClient.post<DocPushResponse>(
        `/projects/${projectSlug}/docs/push`,
        options || {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-push-history", projectSlug],
      });
      // Refresh preview in case content changed
      queryClient.invalidateQueries({
        queryKey: ["doc-preview", projectSlug],
      });
    },
  });
}

export function useDocPushHistory(projectSlug: string) {
  return useQuery({
    queryKey: ["doc-push-history", projectSlug],
    queryFn: () =>
      apiClient.get<DocPushHistoryResponse>(
        `/projects/${projectSlug}/docs/push/history`,
      ),
    enabled: !!projectSlug,
  });
}
