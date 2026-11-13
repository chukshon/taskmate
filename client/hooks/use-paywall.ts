"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { toast } from "@/components/ui/toast"
import { useApiAuth } from "@/hooks/use-api-auth"
import type { Feature, UsageKind } from "@/lib/billing"
import { getUsage } from "@/services/usage/requests"

const planMessages: Record<Feature, string> = {
  bots: "Bots are part of the paid plan.",
  sandboxes: "Sandboxes are part of the paid plan.",
}

const usageMessages: Record<UsageKind, string> = {
  ai: "Your bots have used up their AI usage for this billing period.",
  sandbox: "Your sandbox hours for this billing period are used up.",
}

// Checks to run before a billable action. Each returns whether it may go ahead,
// and when it may not, shows a toast that leads to the page that explains why.
// The server enforces the same things; these only explain them.
export function usePaywall() {
  const { isLoaded, has } = useAuth()
  const { getAccessToken } = useApiAuth()
  const router = useRouter()

  const block = React.useCallback(
    (title: string, description: string, label: string, href: string) => {
      const id = toast.add({
        type: "error",
        title,
        description,
        actionProps: {
          children: label,
          onClick: () => {
            toast.close(id)
            router.push(href)
          },
        },
      })
    },
    [router]
  )

  const showUpgradeRequired = React.useCallback(() => {
    block(
      "Upgrade to continue",
      "Bots and their sandboxes are part of the paid plan.",
      "See plans",
      "/pricing"
    )
  }, [block])

  const showUsageLimit = React.useCallback(
    (kind: UsageKind) => {
      block("Usage limit reached", usageMessages[kind], "View usage", "/usage")
    },
    [block]
  )

  // Whether the user's plan has the feature
  const checkPlan = React.useCallback(
    (feature: Feature) => {
      // Not known yet: let the server decide
      if (!isLoaded || has?.({ feature })) return true

      block(
        "Upgrade to continue",
        planMessages[feature],
        "See plans",
        "/pricing"
      )
      return false
    },
    [isLoaded, has, block]
  )

  // Whether the billing period has any of the allowance left. Only the ledger
  // knows, so this asks the server.
  const checkUsage = React.useCallback(
    async (kind: UsageKind) => {
      const usage = await getUsage(await getAccessToken())
      if (usage && usage.remaining[kind] > 0) return true

      showUsageLimit(kind)
      return false
    },
    [getAccessToken, showUsageLimit]
  )

  return { checkPlan, checkUsage, showUpgradeRequired, showUsageLimit }
}
