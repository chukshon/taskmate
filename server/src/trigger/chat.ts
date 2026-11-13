import { chat } from "@trigger.dev/sdk/ai";
import { isStepCount } from "ai";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { aiProviderIds, defaultAIProvider } from "@/config/ai.config";
import { db } from "@/db";
import { chatMembers, chats, type Bot, type Chat } from "@/db/schema";
import { USAGE_LIMIT_ERROR } from "@/lib/billing";
import { MEMORY_FILE } from "@/services/daytona.service";
import { createChatModel } from "@/services/ai-model.service";
import {
  createHandoffTool,
  type Handoff,
} from "@/services/handoff-tool";
import {
  createSandboxTools,
  type ChatUIMessage,
} from "@/services/sandbox-tools";
import {
  chatModelCost,
  getUsage,
  recordUsage,
} from "@/services/usage.service";
import { toSafeChatErrorMessage } from "@/utils/safe-chat-error";

const clientDataSchema = z.object({
  provider: z.enum(aiProviderIds).default(defaultAIProvider),
  model: z.string().min(1).max(128).default("auto"),
  // The bot a group chat's message is addressed to
  botId: z.string().optional(),
});

async function getChatBots(chatId: string, botId?: string) {
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

  const bots = row?.members.map((member) => member.bot) ?? [];
  const bot = bots.find((member) => member.id === botId) ?? bots[0];
  if (!row || !bot) throw new Error("Bot is not in this chat");

  return { chat: row, bots, bot };
}

function buildGroupInstructions(
  bot: Pick<Bot, "id" | "name" | "job">,
  chat: Chat,
  bots: Pick<Bot, "id" | "name" | "job">[],
) {
  const teammates = bots
    .filter((teammate) => teammate.id !== bot.id)
    .map(
      (teammate) => `- ${teammate.name} (id: ${teammate.id}): ${teammate.job}`,
    )
    .join("\n");

  return [
    `You are in a group chat${chat.name ? ` called "${chat.name}"` : ""}, together with the person and these other teammates. Each of them has a job and a sandbox of their own:\n\n${teammates}`,
    "The person addresses each message to one teammate, and this one is yours: either they picked you, or a teammate handed it to you. Earlier replies in this conversation may have been written by other teammates rather than by you. Use them as context, and do not present their work as your own.",
    "Besides your sandbox tools you have a handoff tool. Call it when a request clearly belongs to a teammate's job rather than yours, with their id and a short note on what is needed. That teammate then takes over and answers in your place, so write nothing more once you have called it. Do not hand off what you can do well yourself, or because a request is merely hard, and never pass a request back to a teammate who handed it to you. When nobody fits better, answer it yourself.",
  ];
}

// How a bot carries what it learns from one chat to the others it is in
const memoryInstructions = [
  "You talk to the person in more than one conversation: a private one-to-one chat, and any group chats they add you to. Each conversation only shows you its own messages, so nothing said in one is visible to you in another. Your memory is what carries across: notes you save with the remember tool and read back with the recall tool, the same notes in every conversation.",
  "Personal facts are never in the sandbox desktop or random files unless you saved them with remember. If they ask what their dog is called, what their name is, what they prefer, or anything they told you earlier — including in a different chat — call recall first in this turn. An empty memory means you truly do not know; do not invent, and do not claim you lack access to personal information until recall has run.",
  `Call remember in the same turn you learn something that would be useful in a later conversation: their name, pet names, preferences, projects, decisions, standing instructions, and every time they ask you to remember something. A reply that only says you noted it or will remember it is wrong — unless remember runs, the fact is gone when this chat ends. Leave out small talk and details that only matter to the request in front of you. The notes live in ${MEMORY_FILE} in your sandbox's home directory; use the remember and recall tools for it, not bash.`,
];

function buildInstructions(
  bot: Awaited<ReturnType<typeof getChatBots>>["bot"],
  group?: {
    chat: Chat;
    bots: Awaited<ReturnType<typeof getChatBots>>["bots"];
  },
) {
  return [
    `You are ${bot.name}, an AI teammate. Your job: ${bot.job}`,
    "You work alongside the person you are talking to as a member of their team. They gave you your name and your job, and they come to you for that job. Stay in that role, and when asked who you are, answer as yourself — include your name, your job, and that you have your own isolated Linux sandbox.",
    bot.instructions &&
      `They also told you how to go about your job:\n\n${bot.instructions}`,
    "You have a sandbox of your own: an isolated Linux machine in the cloud with its own filesystem, network, CPU, memory and disk. It belongs to you alone, is not shared with other teammates, and stays yours for as long as you exist. Files you leave there are still there next time.",
    "Your tools all act on that sandbox. You can run shell commands and read, write and list files. It also has a graphical desktop, 1024x768 pixels, that you operate with the mouse and keyboard tools. Prefer the shell and file tools when they can do the job; use the desktop for things that need a screen.",
    "On the desktop you work blind until you look: call viewScreen to see it before you click or type, and again afterwards to check what happened. viewScreen is for your own eyes. Call showScreen instead only when the person asks to see the screen or asks what is on it, because that one puts the screenshot in the chat.",
    ...memoryInstructions,
    ...(group ? buildGroupInstructions(bot, group.chat, group.bots) : []),
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
    tools: async ({ chatId, clientData }) => {
      const {
        chat: { kind, userId },
        bots,
        bot,
      } = await getChatBots(chatId, clientData?.botId);

      // Whoever holds the turn; a handoff moves it, and the sandbox tools with it
      let current = bot;
      const held = new Set([bot.id]);

      // Asked before every tool call, so a yes is kept for a minute
      let checkedAt = 0;
      const sandboxTools = createSandboxTools(async () => {
        if (!current.sandboxId) {
          throw new Error("This bot has no sandbox.");
        }
        if (Date.now() - checkedAt > 60_000) {
          const usage = await getUsage(userId);
          if (!usage || usage.remaining.sandbox <= 0) {
            throw new Error(
              "The sandbox hours for this billing period are used up, so the sandbox can't be used until the period resets.",
            );
          }
          checkedAt = Date.now();
        }
        return current.sandboxId;
      });

      if (kind !== "group") return sandboxTools;

      return {
        ...sandboxTools,
        ...createHandoffTool((botId) => {
          const target = bots.find((member) => member.id === botId);
          if (!target) throw new Error("No teammate in this chat has that id.");
          // Keeps a request from bouncing between bots
          if (held.has(target.id)) {
            throw new Error(
              `${target.name} already had this request. Answer it yourself.`,
            );
          }

          current = target;
          held.add(target.id);
          return { botId: target.id, name: target.name };
        }),
      };
    },
    // Fires for stopped and failed turns too, which spent tokens all the same
    onTurnComplete: async ({ chatId, runId, turn, usage }) => {
      const [row] = await db
        .select({ userId: chats.userId })
        .from(chats)
        .where(eq(chats.id, chatId));

      if (usage && row) {
        await recordUsage([
          {
            userId: row.userId,
            kind: "ai",
            amount: chatModelCost(usage),
            idempotencyKey: `ai:${runId}:${turn}`,
          },
        ]);
      }
    },
    run: async ({
      chatId,
      clientData,
      messages,
      tools,
      signal,
      streamText,
    }) => {
      const { chat: currentChat, bots, bot } = await getChatBots(
        chatId,
        clientData?.botId,
      );
      const selection = {
        provider: clientData?.provider ?? defaultAIProvider,
        model: clientData?.model ?? "auto",
      };
      const group =
        currentChat.kind === "group"
          ? { chat: currentChat, bots }
          : undefined;

      // Every turn, as a session outlives the plan it was started on
      const usage = await getUsage(currentChat.userId);
      if (!usage || usage.remaining.ai <= 0) throw new Error(USAGE_LIMIT_ERROR);

      // Stamped on the reply and kept in the transcript with it
      chat.setUIMessageStreamOptions({
        messageMetadata: () => ({ botId: bot.id }),
      });

      return streamText({
        model: createChatModel(selection),
        system: buildInstructions(bot, group),
        messages,
        tools,
        // After a handoff the rest of the turn is the other bot's to answer
        prepareStep: ({ steps }) => {
          const results = steps.flatMap((step) => step.toolResults);
          const handoff = [...results]
            .reverse()
            .find((result) => result.toolName === "handoff");
          const current =
            handoff &&
            bots.find(
              (member) => member.id === (handoff.output as Handoff).botId,
            );

          return current
            ? { instructions: buildInstructions(current, group) }
            : undefined;
        },
        stopWhen: [
          isStepCount(50),
          // A long turn ends once it has spent what was left
          ({ steps }) =>
            steps.reduce((cost, step) => cost + chatModelCost(step.usage), 0) >=
            usage.remaining.ai,
        ],
        abortSignal: signal,
        maxOutputTokens: 4096,
        ...(selection.provider === "openai"
          ? { providerOptions: { openai: { store: false } } }
          : {}),
      });
    },
  });
