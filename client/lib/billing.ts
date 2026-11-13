// Slugs of the features on the paid plan in Clerk. The free plan has neither.
export type Feature = "bots" | "sandboxes"

export const UPGRADE_REQUIRED_MESSAGE = "Upgrade required"

// Thrown by the chat agent, and recognised by the chat, when a turn can't start
// because the billing period's allowance is spent
export const USAGE_LIMIT_ERROR =
  "You've used up your usage for this billing period."

export const USAGE_LIMIT_REACHED_MESSAGE = "Usage limit reached"

export type UsageKind = "ai" | "sandbox"
