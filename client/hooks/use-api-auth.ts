"use client"

import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"

import { ApiError } from "@/lib/api-error"

export function useApiAuth() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth()
  const getAccessToken = useCallback(async () => {
    const token = await getToken()
    if (!token)
      throw new ApiError("Your session has expired. Sign in again.", 401)
    return token
  }, [getToken])

  return { getAccessToken, userId, isLoaded, isSignedIn }
}
