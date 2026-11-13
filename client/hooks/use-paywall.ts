"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import { toast } from "@/components/ui/toast"
import type { Feature } from "@/lib/billing"

const planMessages: Record<Feature, string> = {
  bots: "Bots are part of the paid plan.",
  sandboxes: "Sandboxes are part of the paid plan.",
}

// Checks to run before a billable action. Each returns whether it may go ahead,
// and when it may not, shows a toast that leads to the page that explains why.
// The server enforces the same things; these only explain them.
export function usePaywall() {
  const { isLoaded, has } = useAuth()
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

  return { checkPlan, showUpgradeRequired }
}
