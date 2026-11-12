import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";
import type { getChat } from "@/services/chat.service";
import { createChatModel } from "@/services/ai-model.service";
import type { ChatModelSelection } from "@/services/ai-model.service";
import { getSafeChatErrorLog } from "@/utils/safe-chat-error";
import { logger } from "@/utils/logger";

export async function streamChatReply(
  chat: Awaited<ReturnType<typeof getChat>>,
  messages: UIMessage[],
  abortSignal: AbortSignal,
  selection: ChatModelSelection,
) {
  const bot = chat.bots[0];

  return streamText({
    model: createChatModel(selection),
    instructions: `You are ${bot.name}. Your job is: ${bot.job}.\n${bot.instructions ?? ""}`,
    messages: await convertToModelMessages(messages),
    abortSignal,
    maxOutputTokens: 4096,
    ...(selection.provider === "openai" ? { providerOptions: { openai: { store: false } } } : {}),
    onError: ({ error }) => {
      logger.warn("AI chat generation failed", getSafeChatErrorLog(error));
    },
  });
}
