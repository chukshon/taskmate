import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import type { Bot, CreateBotRequest, DeletedBot } from "@/services/bots/types"
import type { ApiResponse } from "@/types/api-response"

export async function getBots(
  token: string,
  signal?: AbortSignal
): Promise<Bot[]> {
  const response = await api.get<ApiResponse<Bot[]>>("/bots", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const bots = getApiData(response.data)
  if (
    !Array.isArray(bots) ||
    bots.some((bot) => typeof bot?.id !== "string" || typeof bot?.name !== "string")
  ) {
    throw new ApiError("The API returned an unexpected bot list.")
  }
  return bots
}

export async function deleteBot(
  botId: string,
  token: string
): Promise<DeletedBot> {
  const response = await api.delete<ApiResponse<DeletedBot>>(
    `/bots/${encodeURIComponent(botId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  const result = getApiData(response.data)
  if (
    typeof result?.id !== "string" ||
    !Array.isArray(result.deletedChatIds) ||
    !result.deletedChatIds.every((id) => typeof id === "string")
  )
    throw new ApiError("The API returned an unexpected delete response.")
  return result
}

export async function createBot(
  values: CreateBotRequest,
  token: string
): Promise<Bot> {
  const response = await api.post<ApiResponse<Bot>>("/bots", values, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const bot = getApiData(response.data)
  if (typeof bot?.id !== "string" || typeof bot?.name !== "string") {
    throw new ApiError("The API returned an unexpected bot response.")
  }
  return bot
}

export async function updateBot(
  botId: string,
  values: CreateBotRequest,
  token: string
): Promise<Bot> {
  const response = await api.put<ApiResponse<Bot>>(
    `/bots/${encodeURIComponent(botId)}`,
    values,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  const bot = getApiData(response.data)
  if (typeof bot?.id !== "string" || typeof bot?.name !== "string")
    throw new ApiError("The API returned an unexpected bot response.")
  return bot
}
