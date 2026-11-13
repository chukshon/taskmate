export const usageKeys = {
  all: (userId: string) => ["usage", userId] as const,
  current: (userId: string) => [...usageKeys.all(userId), "current"] as const,
}
