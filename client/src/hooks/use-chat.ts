import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ChatThread,
  ChatMessage,
  ChatThreadListResponse,
  ChatThreadDetailResponse,
  ChatProviderListResponse,
  AIProviderConfig,
} from "@shared/types";
import type { CreateChatThread } from "@shared/validators";

export function useChatThreads(filters?: {
  projectId?: number;
  agentRole?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["chat-threads", filters],
    queryFn: () =>
      apiClient.get<ChatThreadListResponse>("/chat/threads", filters as any),
  });
}

export function useChatThread(id: number | null) {
  return useQuery({
    queryKey: ["chat-threads", id],
    queryFn: () =>
      apiClient.get<ChatThreadDetailResponse>(`/chat/threads/${id}`),
    enabled: !!id,
  });
}

export function useCreateChatThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatThread) =>
      apiClient.post<{ thread: ChatThread }>("/chat/threads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

export function useArchiveChatThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.delete<{ thread: ChatThread }>(`/chat/threads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      content,
    }: {
      threadId: number;
      content: string;
    }) =>
      apiClient.post<{ message: ChatMessage }>(
        `/chat/threads/${threadId}/messages`,
        { content },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-threads", variables.threadId],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

export function useChatProviders() {
  return useQuery({
    queryKey: ["chat-providers"],
    queryFn: () =>
      apiClient.get<ChatProviderListResponse>("/chat/providers"),
  });
}

export function useUpdateChatProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      data,
    }: {
      slug: string;
      data: Record<string, unknown>;
    }) =>
      apiClient.patch<{ provider: AIProviderConfig }>(
        `/chat/providers/${slug}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-providers"] });
    },
  });
}
