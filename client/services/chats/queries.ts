"use client"

import { useQuery } from "@tanstack/react-query"
import { useApiAuth } from "@/hooks/use-api-auth"
import { chatKeys } from "@/services/chats/keys"
import { getChat, getChats } from "@/services/chats/requests"
import { ApiError } from "@/lib/api-error"

export function useChatQuery(chatId: string) {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: chatKeys.detail(userId, chatId),
    queryFn: async ({ signal }) =>
      getChat(chatId, await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn && !!chatId,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 2,
  })
}

export function useChatsQuery(enabled = true) {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: chatKeys.list(userId),
    queryFn: async ({ signal }) => getChats(await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn && enabled,
  })
}
