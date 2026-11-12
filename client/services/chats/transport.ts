import { DefaultChatTransport } from "ai"
import { env } from "@/config/env"

export function createChatTransport(
  chatId: string,
  getAccessToken: () => Promise<string>
) {
  return new DefaultChatTransport({
    api: `${env.NEXT_PUBLIC_API_URL}/api/v1/chats/${encodeURIComponent(chatId)}/messages`,
    headers: async () => ({
      Authorization: `Bearer ${await getAccessToken()}`,
    }),
    prepareSendMessagesRequest: ({ messages, body }) => ({
      body: {
        ...body,
        messages: messages
          .map(({ id, role, parts }) => ({
            id,
            role,
            parts: parts.filter((part) => part.type === "text"),
          }))
          .filter(({ parts }) => parts.length > 0),
      },
    }),
  })
}
