import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DocGenerateResponse } from "../../../shared/types";

export function useGenerateDocs(projectSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options?: { force?: boolean }) =>
      apiClient.post<DocGenerateResponse>(
        `/projects/${projectSlug}/docs/generate`,
        options || {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
    },
  });
}
