import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react"
import type { UIMessage } from "ai"
import { env } from "@/config/env"
import { ApiError } from "@/lib/api-error"
import { getApiData } from "@/lib/api-response"
import type { ChatModelSelection } from "@/schemas/ai.schema"
import type { ApiResponse } from "@/types/api-response"

export type ChatMessageMetadata = { botId?: string }
export type ChatUIMessage = UIMessage<ChatMessageMetadata>

async function authorizedJson<T>(
  path: string,
  getAccessToken: () => Promise<string>,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
      ...init?.headers,
    },
  })
  const body = (await response.json()) as ApiResponse<T>
  if (!response.ok) {
    throw new ApiError(
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : "The API request failed. Please try again.",
      response.status
    )
  }
  return getApiData(body)
}

export function useChatTransport({
  getAccessToken,
  clientData,
}: {
  getAccessToken: () => Promise<string>
  clientData: ChatModelSelection
}) {
  return useTriggerChatTransport({
    task: "chat",
    clientData,
    accessToken: async ({ chatId }) =>
      authorizedJson<string>(
        `/chats/${encodeURIComponent(chatId)}/access-token`,
        getAccessToken,
        { method: "POST" }
      ),
    startSession: async ({ chatId, clientData: sessionClientData }) => {
      const data = await authorizedJson<{
        publicAccessToken: string
        pendingVersion?: boolean
      }>(`/chats/${encodeURIComponent(chatId)}/session`, getAccessToken, {
        method: "POST",
        body: JSON.stringify({ clientData: sessionClientData }),
      })
      return {
        publicAccessToken: data.publicAccessToken,
        pendingVersion: data.pendingVersion,
      }
    },
  })
}

export async function loadChatTranscript(
  {
    chatId,
    limit,
  }: {
    chatId: string
    limit?: number
  },
  getAccessToken: () => Promise<string>
) {
  const params = new URLSearchParams()
  if (limit != null) params.set("limit", String(limit))
  const query = params.size ? `?${params}` : ""
  return authorizedJson<{
    messages: ChatUIMessage[]
    cursors?: { lastOutEventId?: string; lastInEventId?: string }
    nextCursor?: string
  }>(
    `/chats/${encodeURIComponent(chatId)}/transcript${query}`,
    getAccessToken
  )
}
