import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  SitePlanResponse,
  SitePlan,
  SitePage,
  SiteConnection,
} from "@shared/types";
import type { InsertSitePage, UpdateSitePage, InsertSiteConnection } from "@shared/validators";

export function useSitePlan(projectSlug: string) {
  return useQuery({
    queryKey: ["site-plan", projectSlug],
    queryFn: () =>
      apiClient.get<SitePlanResponse>(
        `/projects/${projectSlug}/site-plan`,
      ),
    enabled: !!projectSlug,
  });
}

export function useUpdateSitePlan(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      canvasState?: { zoom: number; panX: number; panY: number };
    }) =>
      apiClient.patch<{ plan: SitePlan }>(
        `/projects/${projectSlug}/site-plan`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useCreateSitePage(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSitePage) =>
      apiClient.post<{ page: SitePage }>(
        `/projects/${projectSlug}/site-plan/pages`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useUpdateSitePage(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: number; data: UpdateSitePage }) =>
      apiClient.patch<{ page: SitePage }>(
        `/projects/${projectSlug}/site-plan/pages/${pageId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useDeleteSitePage(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: number) =>
      apiClient.delete<{ success: boolean }>(
        `/projects/${projectSlug}/site-plan/pages/${pageId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useCreateSiteConnection(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSiteConnection) =>
      apiClient.post<{ connection: SiteConnection }>(
        `/projects/${projectSlug}/site-plan/connections`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useDeleteSiteConnection(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connId: number) =>
      apiClient.delete<{ success: boolean }>(
        `/projects/${projectSlug}/site-plan/connections/${connId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}

export function useLinkTaskToPage(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      taskId,
    }: {
      pageId: number;
      taskId: number | null;
    }) =>
      apiClient.post<{ page: SitePage }>(
        `/projects/${projectSlug}/site-plan/pages/${pageId}/link-task`,
        { taskId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["site-plan", projectSlug],
      });
    },
  });
}
