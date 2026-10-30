export const botKeys = {
  all: (userId: string) => ["bots", userId] as const,
  lists: (userId: string) => [...botKeys.all(userId), "list"] as const,
  detail: (userId: string, botId: string) =>
    [...botKeys.all(userId), "detail", botId] as const,
}
