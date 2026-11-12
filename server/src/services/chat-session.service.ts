import { auth } from "@trigger.dev/sdk";
import { chat, defaultStorage } from "@trigger.dev/sdk/ai";
import type { ChatStartSessionParams } from "@trigger.dev/sdk/ai";
import { getChat } from "@/services/chat.service";
import type { chatAgent } from "@/trigger/chat";

const startSession = chat.createStartSessionAction<typeof chatAgent>("chat");
const loadStoredTranscript = chat.createLoadTranscriptAction(defaultStorage, {
  limit: 100,
});

export async function startChatSession(
  userId: string,
  params: ChatStartSessionParams<typeof chatAgent>,
) {
  await getChat(userId, params.chatId);
  return startSession(params);
}

export async function mintChatAccessToken(userId: string, chatId: string) {
  await getChat(userId, chatId);
  return auth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  });
}

export async function loadChatTranscript(
  userId: string,
  params: { chatId: string; limit?: number; before?: string },
) {
  await getChat(userId, params.chatId);
  return loadStoredTranscript(params);
}
