"use client"

import { useQuery } from "@tanstack/react-query"
import { useApiAuth } from "@/hooks/use-api-auth"
import { chatKeys } from "@/services/chats/keys"
import { getChats } from "@/services/chats/requests"

export function useChatsQuery() {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: chatKeys.list(userId),
    queryFn: async ({ signal }) => getChats(await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn,
  })
}
