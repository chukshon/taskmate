"use client"

import { useQuery } from "@tanstack/react-query"

import { useApiAuth } from "@/hooks/use-api-auth"
import { usageKeys } from "@/services/usage/keys"
import { getUsage } from "@/services/usage/requests"

export function useUsageQuery(enabled = true) {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: usageKeys.current(userId ?? "signed-out"),
    queryFn: async ({ signal }) => getUsage(await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn && enabled,
  })
}
