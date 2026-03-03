import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AnalyticsResponse {
  tasksPerWeek: { week: string; count: number }[];
  taskStatusDist: Record<string, number>;
  pushesPerWeek: { week: string; count: number }[];
  recentActivity: unknown[];
}

export function useAnalytics(projectId?: number) {
  return useQuery({
    queryKey: ["analytics", projectId],
    queryFn: () =>
      apiClient.get<AnalyticsResponse>(
        "/analytics",
        projectId ? { projectId } : undefined,
      ),
  });
}
