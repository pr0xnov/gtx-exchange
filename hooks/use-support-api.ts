"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAccessToken } from "@/lib/auth/client-refresh";
import type {
  SupportCategory,
  SupportConversationStatus,
  SupportSenderType,
} from "@prisma/client";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  isRetry = false
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return fetchJson<T>(url, init, true);
  }

  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data;
}

export interface SupportConversationDto {
  id: string;
  category: SupportCategory;
  status: SupportConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageDto {
  id: string;
  senderType: SupportSenderType;
  message: string;
  createdAt: string;
}

/** The current user's own conversations, newest activity first — the
 *  /contacts chat widget uses the first OPEN one as its active thread. */
export function useMySupportConversations(enabled: boolean) {
  return useQuery({
    queryKey: ["support", "conversations"],
    queryFn: () => fetchJson<SupportConversationDto[]>("/api/support/conversations"),
    enabled,
  });
}

export function useCreateSupportConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: SupportCategory) =>
      fetchJson<SupportConversationDto>("/api/support/conversations", {
        method: "POST",
        body: JSON.stringify({ category }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "conversations"] });
    },
  });
}

/** Polled every few seconds while the chat drawer is open (`enabled`) —
 *  a lightweight refetch, not a websocket, per this feature's own scope
 *  (see server/ws/index.ts: the existing socket is an unauthenticated,
 *  public market-data broadcast with no per-user channel concept, so
 *  reusing it for private conversation delivery would mean building real
 *  per-connection auth and routing from scratch — exactly the "new
 *  complex websocket system" this feature was told not to build). Paused
 *  entirely while the drawer is closed so a background tab never keeps
 *  polling a conversation nobody is looking at. */
export function useSupportMessages(conversationId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["support", "messages", conversationId],
    queryFn: () =>
      fetchJson<{ status: SupportConversationStatus; messages: SupportMessageDto[] }>(
        `/api/support/conversations/${conversationId}/messages`
      ),
    enabled: enabled && Boolean(conversationId),
    refetchInterval: enabled && conversationId ? 6000 : false,
  });
}

export function useSendSupportMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      fetchJson<SupportMessageDto>(
        `/api/support/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ message }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support", "messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["support", "conversations"] });
    },
  });
}
