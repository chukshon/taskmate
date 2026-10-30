"use client"

import { useQuery } from "@tanstack/react-query"

import { useApiAuth } from "@/hooks/use-api-auth"
import { authKeys } from "@/services/auth/keys"
import { getApiSession } from "@/services/auth/requests"

export function useApiSessionQuery(enabled = true) {
  const { getAccessToken, userId, isLoaded, isSignedIn } = useApiAuth()
  return useQuery({
    queryKey: authKeys.session(userId),
    queryFn: async ({ signal }) =>
      getApiSession(await getAccessToken(), signal),
    enabled: isLoaded && !!isSignedIn && enabled,
    retry: false,
  })
}
