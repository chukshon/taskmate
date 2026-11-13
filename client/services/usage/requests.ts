import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import type { ApiResponse } from "@/types/api-response"
import type { UsageSnapshot } from "@/services/usage/types"

export async function getUsage(
  token: string,
  signal?: AbortSignal
): Promise<UsageSnapshot | null> {
  const response = await api.get<ApiResponse<UsageSnapshot | null>>("/usage", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const data = getApiData(response.data)
  if (data === null) return null
  if (
    !data ||
    typeof data !== "object" ||
    !("period" in data) ||
    !("used" in data) ||
    !("remaining" in data) ||
    !("limits" in data)
  ) {
    throw new ApiError("The API returned unexpected usage data.")
  }
  return data
}
