"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useApiAuth } from "@/hooks/use-api-auth"
import { useApiSessionQuery } from "@/services/auth/queries"

export function ApiSessionCheck() {
  const { isLoaded, isSignedIn } = useApiAuth()
  const { refetch, isFetching, isSuccess, error } = useApiSessionQuery(false)
  const message = isFetching
    ? "Checking your API session…"
    : error
      ? error.message
      : isSuccess
        ? "Connected. The API verified your Clerk session."
        : "Check that your account is authenticated with the API."

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        onClick={() => {
          void refetch()
        }}
        disabled={!isLoaded || !isSignedIn || isFetching}
      >
        {isFetching && <Spinner data-icon="inline-start" />}
        Check API connection
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
