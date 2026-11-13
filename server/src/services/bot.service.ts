import { nanoid } from "nanoid";
import { db } from "@/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { bots, chatMembers, chats, type BotInsert } from "@/db/schema";
import type { BotFormValues } from "@/db/bot-schema";
import { USAGE_LIMIT_REACHED_MESSAGE } from "@/lib/billing";
import {
  createBotSandbox,
  deleteBotSandbox,
} from "@/services/daytona.service";
import { getUsage } from "@/services/usage.service";
import {
  ForbiddenException,
  InternalServerException,
  NotFoundException,
} from "@/utils/app-error";

export async function getBots(userId: string) {
  return db.query.bots.findMany({
    where: eq(bots.userId, userId),
    orderBy: [desc(bots.createdAt), asc(bots.id)],
  });
}

export async function deleteBot(
  userId: string,
  botId: string,
  removeSandbox: typeof deleteBotSandbox = deleteBotSandbox,
) {
  const [owned] = await db
    .select({ sandboxId: bots.sandboxId })
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)));
  if (!owned) throw new NotFoundException("Bot not found.");

  // Sandbox first so a Daytona failure leaves the bot for a retry.
  await removeSandbox(owned.sandboxId);

  return db.transaction(async (tx) => {
    const owner = and(eq(bots.id, botId), eq(bots.userId, userId));
    const [bot] = await tx
      .select({ id: bots.id })
      .from(bots)
      .where(owner)
      .for("update");
    if (!bot) throw new NotFoundException("Bot not found.");
    const deletedChats = await tx
      .delete(chats)
      .where(
        and(
          eq(chats.userId, userId),
          eq(chats.kind, "direct"),
          inArray(
            chats.id,
            tx
              .select({ id: chatMembers.chatId })
              .from(chatMembers)
              .where(eq(chatMembers.botId, botId)),
          ),
        ),
      )
      .returning({ id: chats.id });
    await tx.delete(bots).where(owner);
    return { id: botId, deletedChatIds: deletedChats.map(({ id }) => id) };
  });
}

export async function updateBot(
  userId: string,
  botId: string,
  data: BotFormValues,
) {
  const [bot] = await db
    .update(bots)
    .set({
      name: data.name,
      avatar: data.avatar,
      job: data.job,
      instructions: data.instructions || null,
    })
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)))
    .returning();
  if (!bot) throw new NotFoundException("Bot not found.");
  return bot;
}

export async function createBot(
  userId: string,
  data: BotInsert,
  {
    createSandbox = createBotSandbox,
    removeSandbox = deleteBotSandbox,
  }: {
    createSandbox?: typeof createBotSandbox;
    removeSandbox?: typeof deleteBotSandbox;
  } = {},
) {
  // The new sandbox starts running right away
  const usage = await getUsage(userId);
  if (!usage || usage.remaining.sandbox <= 0) {
    throw new ForbiddenException(USAGE_LIMIT_REACHED_MESSAGE);
  }

  const id = nanoid();
  const sandboxId = await createSandbox(id);

  try {
    return await db.transaction(async (tx) => {
      const [bot] = await tx
        .insert(bots)
        .values({
          ...data,
          id,
          userId,
          instructions: data.instructions || null,
          sandboxId,
        })
        .returning();

      if (!bot) throw new InternalServerException("Could not create the bot.");

      const [chat] = await tx
        .insert(chats)
        .values({
          userId,
          kind: "direct",
          name: null,
        })
        .returning({ id: chats.id });

      if (!chat)
        throw new InternalServerException("Could not create the bot's chat.");

      await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id });

      return bot;
    });
  } catch (error) {
    await removeSandbox(sandboxId).catch(() => {});
    throw error;
  }
}
