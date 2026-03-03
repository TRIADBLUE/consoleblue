import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LinkCheck, LinkCheckListResponse } from "@shared/types";

export function useLinkChecks(filters?: { projectId?: number }) {
  return useQuery({
    queryKey: ["link-checks", filters],
    queryFn: () =>
      apiClient.get<LinkCheckListResponse>("/link-monitor", filters as any),
  });
}

export function useTriggerLinkCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: number) =>
      apiClient.post<{ checks: LinkCheck[] }>("/link-monitor/check", {
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["link-checks"] });
    },
  });
}
