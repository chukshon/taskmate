import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import type { ApiSession } from "@/services/auth/types"
import type { ApiResponse } from "@/types/api-response"

export async function getApiSession(
  token: string,
  signal?: AbortSignal
): Promise<ApiSession> {
  const response = await api.get<ApiResponse<ApiSession>>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const session = getApiData(response.data)
  if (
    typeof session?.userId !== "string" ||
    typeof session?.sessionId !== "string"
  ) {
    throw new ApiError("The API returned an unexpected session response.")
  }
  return session
}
