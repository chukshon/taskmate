import { chat } from "@trigger.dev/sdk/ai";
import { isStepCount } from "ai";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { aiProviderIds, defaultAIProvider } from "@/config/ai.config";
import { db } from "@/db";
import { chatMembers, chats } from "@/db/schema";
import { createChatModel } from "@/services/ai-model.service";
import {
  createSandboxTools,
  type ChatUIMessage,
} from "@/services/sandbox-tools";
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
              sandboxId: true,
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

function buildInstructions(bot: Awaited<ReturnType<typeof getChatBot>>) {
  return [
    `You are ${bot.name}, an AI teammate. Your job: ${bot.job}`,
    "You work alongside the person you are talking to as a member of their team. They gave you your name and your job, and they come to you for that job. Stay in that role, and when asked who you are, answer as yourself — include your name, your job, and that you have your own isolated Linux sandbox.",
    bot.instructions &&
      `They also told you how to go about your job:\n\n${bot.instructions}`,
    "You have a sandbox of your own: an isolated Linux machine in the cloud with its own filesystem, network, CPU, memory and disk. It belongs to you alone, is not shared with other teammates, and stays yours for as long as you exist. Files you leave there are still there next time.",
    "Your tools all act on that sandbox. You can run shell commands and read, write and list files. It also has a graphical desktop, 1024x768 pixels, that you operate with the mouse and keyboard tools. Prefer the shell and file tools when they can do the job; use the desktop for things that need a screen.",
    "On the desktop you work blind until you look: call viewScreen to see it before you click or type, and again afterwards to check what happened. viewScreen is for your own eyes. Call showScreen instead only when the person asks to see the screen or asks what is on it, because that one puts the screenshot in the chat.",
    "Do the work rather than describing how it could be done, and say plainly when something failed.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// Transcript is kept per chatId by the agent's default transcript storage.
export const chatAgent = chat
  .withUIMessage<ChatUIMessage>()
  .withClientData({ schema: clientDataSchema })
  .agent({
    id: "chat",
    uiMessageStreamOptions: {
      onError: (error) => toSafeChatErrorMessage(error),
    },
    // Declared here so screenshots stay images when earlier turns are replayed.
    tools: async ({ chatId }) =>
      createSandboxTools(async () => {
        const bot = await getChatBot(chatId);
        if (!bot.sandboxId) {
          throw new Error("This bot has no sandbox.");
        }
        return bot.sandboxId;
      }),
    run: async ({
      chatId,
      clientData,
      messages,
      tools,
      signal,
      streamText,
    }) => {
      const bot = await getChatBot(chatId);
      const selection = {
        provider: clientData?.provider ?? defaultAIProvider,
        model: clientData?.model ?? "auto",
      };

      return streamText({
        model: createChatModel(selection),
        system: buildInstructions(bot),
        messages,
        tools,
        stopWhen: isStepCount(50),
        abortSignal: signal,
        maxOutputTokens: 4096,
        ...(selection.provider === "openai"
          ? { providerOptions: { openai: { store: false } } }
          : {}),
      });
    },
  });
