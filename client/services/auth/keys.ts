export const authKeys = {
  session: (userId: string | null | undefined) =>
    ["auth", userId ?? "signed-out", "session"] as const,
}
