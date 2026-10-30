import { api } from "@/config/axios"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import type { Bot, CreateBotRequest } from "@/services/bots/types"
import type { ApiResponse } from "@/types/api-response"

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
