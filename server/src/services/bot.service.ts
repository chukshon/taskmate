import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { bots, chatMembers, chats, type BotInsert } from "@/db/schema";
import type { BotFormValues } from "@/db/bot-schema";
import { InternalServerException, NotFoundException } from "@/utils/app-error";

export async function updateBot(userId: string, botId: string, data: BotFormValues) {
  const [bot] = await db.update(bots).set({
    name: data.name, avatar: data.avatar, job: data.job,
    instructions: data.instructions || null,
  }).where(and(eq(bots.id, botId), eq(bots.userId, userId))).returning();
  if (!bot) throw new NotFoundException("Bot not found.");
  return bot;
}

export async function createBot(userId: string, data: BotInsert) {
  return db.transaction(async (tx) => {
    const [bot] = await tx.insert(bots).values({
      ...data,
      userId,
      instructions: data.instructions || null,
    }).returning();

    if (!bot) throw new InternalServerException("Could not create the bot.");

    const [chat] = await tx.insert(chats).values({
      userId,
      kind: "direct",
      name: null,
    }).returning({ id: chats.id });

    if (!chat) throw new InternalServerException("Could not create the bot's chat.");

    await tx.insert(chatMembers).values({ chatId: chat.id, botId: bot.id });

    return bot;
  });
}
