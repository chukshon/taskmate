export type ApiSession = { userId: string; sessionId: string }

export async function getApiSession(token: string): Promise<ApiSession> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const result = await response.json()

  if (!response.ok || result.success !== true) {
    throw new Error(result.message ?? "Could not verify your API session.")
  }
  if (typeof result.data?.userId !== "string" || typeof result.data?.sessionId !== "string") {
    throw new Error("The API returned an unexpected session response.")
  }
  return result.data
}
