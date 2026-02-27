import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
}

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<{ user: AuthUser }>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiClient.post<{ success: boolean; user: AuthUser }>("/auth/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ success: boolean }>("/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ success: boolean; message: string }>(
        "/auth/forgot-password",
        { email },
      ),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      apiClient.post<{ success: boolean; message: string }>(
        "/auth/reset-password",
        data,
      ),
  });
}

export function useValidateResetToken(token: string | null) {
  return useQuery({
    queryKey: ["auth", "validate-reset-token", token],
    queryFn: () =>
      apiClient.get<{ valid: boolean }>("/auth/validate-reset-token", {
        token: token || "",
      }),
    enabled: !!token,
  });
}
