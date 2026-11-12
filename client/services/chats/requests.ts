import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import { chatListSchema, chatDetailSchema } from "@/schemas/chat.schema"
import type { ChatSummary, ChatDetail } from "@/services/chats/types"
import type { ApiResponse } from "@/types/api-response"
import {
  chatModelCatalogSchema,
  type ChatModelCatalog,
} from "@/schemas/ai.schema"

export async function getChatModels(
  token: string,
  signal?: AbortSignal
): Promise<ChatModelCatalog> {
  const response = await api.get<ApiResponse<ChatModelCatalog>>(
    "/chats/models",
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  )
  const result = chatModelCatalogSchema.safeParse(getApiData(response.data))
  if (!result.success)
    throw new ApiError("The API returned an unexpected model catalogue.")
  return result.data
}

export async function getChat(
  chatId: string,
  token: string,
  signal?: AbortSignal
): Promise<ChatDetail> {
  const response = await api.get<ApiResponse<ChatDetail>>(
    `/chats/${encodeURIComponent(chatId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  )
  const result = chatDetailSchema.safeParse(getApiData(response.data))
  if (!result.success)
    throw new ApiError("The API returned an unexpected chat.")
  return result.data
}

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
