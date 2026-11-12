import { chat } from "@trigger.dev/sdk/ai";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { aiProviderIds, defaultAIProvider } from "@/config/ai.config";
import { db } from "@/db";
import { chatMembers, chats } from "@/db/schema";
import { createChatModel } from "@/services/ai-model.service";
import { toSafeChatErrorMessage } from "@/utils/safe-chat-error";

const clientDataSchema = z.object({
  provider: z.enum(aiProviderIds).default(defaultAIProvider),
  model: z.string().min(1).max(128).default("auto"),
});

async function getChatBot(chatId: string) {
  const row = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
    with: {
      members: {
        orderBy: [asc(chatMembers.joinedAt), asc(chatMembers.botId)],
        with: {
          bot: {
            columns: {
              id: true,
              name: true,
              job: true,
              instructions: true,
            },
          },
        },
      },
    },
  });

  const bot = row?.members[0]?.bot;
  if (!row || !bot) throw new Error("Chat not found.");
  return bot;
}

// Transcript is kept per chatId by the agent's default transcript storage.
export const chatAgent = chat
  .withClientData({ schema: clientDataSchema })
  .agent({
    id: "chat",
    uiMessageStreamOptions: {
      onError: (error) => toSafeChatErrorMessage(error),
    },
    run: async ({ chatId, clientData, messages, signal, streamText }) => {
      const bot = await getChatBot(chatId);
      const selection = {
        provider: clientData?.provider ?? defaultAIProvider,
        model: clientData?.model ?? "auto",
      };

      return streamText({
        model: createChatModel(selection),
        system: `You are ${bot.name}. Your job is: ${bot.job}.\n${bot.instructions ?? ""}`,
        messages,
        abortSignal: signal,
        maxOutputTokens: 4096,
        ...(selection.provider === "openai"
          ? { providerOptions: { openai: { store: false } } }
          : {}),
      });
    },
  });
