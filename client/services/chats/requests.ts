import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import { chatListSchema } from "@/schemas/chat.schema"
import type { ChatSummary } from "@/services/chats/types"
import type { ApiResponse } from "@/types/api-response"

export async function getChats(
  token: string,
  signal?: AbortSignal
): Promise<ChatSummary[]> {
  const response = await api.get<ApiResponse<ChatSummary[]>>("/chats", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const result = chatListSchema.safeParse(getApiData(response.data))
  if (!result.success)
    throw new ApiError("The API returned an unexpected chat list.")
  return result.data
}
