export const chatKeys = {
  all: (userId: string | null | undefined) =>
    ["chats", userId ?? "signed-out"] as const,
  list: (userId: string | null | undefined) =>
    [...chatKeys.all(userId), "list"] as const,
}
