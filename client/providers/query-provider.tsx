"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ApiError } from "@/lib/api-error"

function UserQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (
                error instanceof ApiError &&
                error.status &&
                error.status >= 400 &&
                error.status < 500
              )
                return false
              return failureCount < 1
            },
          },
          mutations: { retry: false },
        },
      })
  )

  useEffect(() => () => queryClient.clear(), [queryClient])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth()
  return (
    <UserQueryProvider key={userId ?? "signed-out"}>
      {children}
    </UserQueryProvider>
  )
}
