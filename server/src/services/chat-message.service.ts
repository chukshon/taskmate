import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";
import { env } from "@/config/env.config";
import type { getChat } from "@/services/chat.service";
import { InternalServerException } from "@/utils/app-error";
import { logger } from "@/utils/logger";

export async function streamChatReply(
  chat: Awaited<ReturnType<typeof getChat>>,
  messages: UIMessage[],
  abortSignal: AbortSignal,
) {
  if (!env.OPENAI_API_KEY) throw new InternalServerException("AI chat is not configured.");
  const bot = chat.bots[0];
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

  return streamText({
    model: openai(env.OPENAI_MODEL),
    instructions: `You are ${bot.name}. Your job is: ${bot.job}.\n${bot.instructions ?? ""}`,
    messages: await convertToModelMessages(messages),
    abortSignal,
    maxOutputTokens: 4096,
    providerOptions: { openai: { store: false } },
    onError: () => { logger.warn("AI chat generation failed"); },
  });
}
