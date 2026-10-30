import { db } from "@/db";
import { bots, chatMembers, chats, type BotInsert } from "@/db/schema";
import { InternalServerException } from "@/utils/app-error";

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
