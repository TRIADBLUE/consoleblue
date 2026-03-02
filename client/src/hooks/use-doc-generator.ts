import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────

interface DocTemplate {
  slug: string;
  title: string;
  category: string;
}

interface TemplatesResponse {
  templates: DocTemplate[];
}

interface GenerateDocsResponse {
  success: boolean;
  projectSlug: string;
  projectName: string;
  docsCreated: number;
  notificationsSent: number;
  autoPushed: boolean;
  commitSha?: string;
}

interface RegenerateDocsResponse {
  success: boolean;
  projectSlug: string;
  docsUpdated: number;
}

// ── Hooks ──────────────────────────────────────────────

/**
 * Fetch available auto-generation templates
 */
export function useDocTemplates() {
  return useQuery({
    queryKey: ["doc-generator", "templates"],
    queryFn: () =>
      apiClient.get<TemplatesResponse>("/doc-generator/templates"),
    staleTime: 5 * 60 * 1000, // templates rarely change
  });
}

/**
 * Trigger auto-generation of onboarding docs for a project.
 * This creates the docs, sends notifications, and optionally
 * auto-pushes CLAUDE.md to GitHub.
 */
export function useGenerateDocs(projectSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<GenerateDocsResponse>(
        `/projects/${projectSlug}/generate-docs`,
      ),
    onSuccess: () => {
      // Invalidate project docs list so the new docs appear
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
      // Invalidate notifications so the bell updates
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      // Invalidate doc push preview
      queryClient.invalidateQueries({
        queryKey: ["doc-push-preview", projectSlug],
      });
    },
  });
}

/**
 * Regenerate (update) existing auto-generated docs with latest
 * project data from ConsoleBlue.
 */
export function useRegenerateDocs(projectSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post<RegenerateDocsResponse>(
        `/projects/${projectSlug}/generate-docs/regenerate`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-docs", projectSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["doc-push-preview", projectSlug],
      });
    },
  });
}
