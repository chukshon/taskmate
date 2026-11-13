import type { UsageKind } from "@/lib/billing"

export type UsageSnapshot = {
  period: { start: string; end: string }
  used: Record<UsageKind, number>
  remaining: Record<UsageKind, number>
  limits: Record<UsageKind, number>
}
