import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ProjectDoc,
  ProjectDocListResponse,
  ReorderDocsResponse,
} from "../../../shared/types";
import type { InsertProjectDoc, UpdateProjectDoc } from "../../../shared/validators";

export function useProjectDocs(projectSlug: string) {
  return useQuery({
    queryKey: ["project-docs", projectSlug],
    queryFn: () =>
      apiClient.get<ProjectDocListResponse>(
        `/projects/${projectSlug}/docs`,
      ),
    enabled: !!projectSlug,
  });
}

export function useProjectDoc(projectSlug: string, docId: number) {
  return useQuery({
    queryKey: ["project-docs", projectSlug, docId],
    queryFn: () =>
      apiClient.get<{ doc: ProjectDoc }>(
        `/projects/${projectSlug}/docs/${docId}`,
      ),
    enabled: !!projectSlug && !!docId,
  });
}

export function useCreateProjectDoc(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertProjectDoc) =>
      apiClient.post<{ doc: ProjectDoc }>(
        `/projects/${projectSlug}/docs`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
    },
  });
}

export function useUpdateProjectDoc(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, data }: { docId: number; data: UpdateProjectDoc }) =>
      apiClient.put<{ doc: ProjectDoc }>(
        `/projects/${projectSlug}/docs/${docId}`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug, variables.docId],
      });
    },
  });
}

export function useDeleteProjectDoc(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) =>
      apiClient.delete<{ success: boolean }>(
        `/projects/${projectSlug}/docs/${docId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
    },
  });
}

export function useReorderProjectDocs(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docIds: number[]) =>
      apiClient.post<ReorderDocsResponse>(
        `/projects/${projectSlug}/docs/reorder`,
        { docIds },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
    },
  });
}
