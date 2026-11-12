import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import {
  chatDesktopUrlSchema,
  chatDetailSchema,
  chatListSchema,
} from "@/schemas/chat.schema"
import type { GroupChatInsert } from "@/schemas/group-chat.schema"
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

export async function getChatDesktopUrl(
  chatId: string,
  token: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await api.get<ApiResponse<{ url: string }>>(
    `/chats/${encodeURIComponent(chatId)}/desktop`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }
  )
  const result = chatDesktopUrlSchema.safeParse(getApiData(response.data))
  if (!result.success)
    throw new ApiError("The API returned an unexpected desktop URL.")
  return result.data.url
}

export async function createGroupChat(
  values: GroupChatInsert,
  token: string
): Promise<{ id: string; name: string | null }> {
  const response = await api.post<
    ApiResponse<{ id: string; name: string | null }>
  >("/chats", values, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const chat = getApiData(response.data)
  if (typeof chat?.id !== "string") {
    throw new ApiError("The API returned an unexpected group chat.")
  }
  return chat
}

export async function updateGroupChat(
  chatId: string,
  values: GroupChatInsert,
  token: string
): Promise<{ id: string; name: string | null }> {
  const response = await api.put<
    ApiResponse<{ id: string; name: string | null }>
  >(`/chats/${encodeURIComponent(chatId)}`, values, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const chat = getApiData(response.data)
  if (typeof chat?.id !== "string") {
    throw new ApiError("The API returned an unexpected group chat.")
  }
  return chat
}

export async function deleteGroupChat(
  chatId: string,
  token: string
): Promise<{ id: string; name: string | null }> {
  const response = await api.delete<
    ApiResponse<{ id: string; name: string | null }>
  >(`/chats/${encodeURIComponent(chatId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const chat = getApiData(response.data)
  if (typeof chat?.id !== "string") {
    throw new ApiError("The API returned an unexpected delete response.")
  }
  return chat
}
