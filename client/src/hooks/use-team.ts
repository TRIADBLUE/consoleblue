import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface TeamUser {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export function useTeamUsers() {
  return useQuery({
    queryKey: ["team"],
    queryFn: () => apiClient.get<{ users: TeamUser[] }>("/team"),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiClient.patch<{ user: TeamUser }>(`/team/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ success: boolean }>(`/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}
