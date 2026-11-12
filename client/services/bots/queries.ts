"use client"

import { useQuery } from "@tanstack/react-query"

import { useApiAuth } from "@/hooks/use-api-auth"
import { botKeys } from "@/services/bots/keys"
import { getBots } from "@/services/bots/requests"

export function useBotsQuery(enabled = true) {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: botKeys.lists(userId ?? "signed-out"),
    queryFn: async ({ signal }) => getBots(await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn && enabled,
  })
}
