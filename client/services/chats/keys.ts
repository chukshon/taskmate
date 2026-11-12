export const chatKeys = {
  models: (userId: string | null | undefined) =>
    [...chatKeys.all(userId), "models"] as const,
  all: (userId: string | null | undefined) =>
    ["chats", userId ?? "signed-out"] as const,
  list: (userId: string | null | undefined) =>
    [...chatKeys.all(userId), "list"] as const,
  detail: (userId: string | null | undefined, chatId: string) =>
    [...chatKeys.all(userId), "detail", chatId] as const,
}
