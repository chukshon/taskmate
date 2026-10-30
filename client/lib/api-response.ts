import { ApiError } from "@/lib/api-error"
import type { ApiResponse } from "@/types/api-response"

export function getApiData<T>(response: ApiResponse<T>): T {
  if (
    !response ||
    typeof response !== "object" ||
    typeof response.success !== "boolean"
  ) {
    throw new ApiError("The API returned an unexpected response.")
  }
  if (!response.success) {
    throw new ApiError(response.message, undefined, response.errors)
  }
  return response.data
}
