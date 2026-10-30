import { db } from "@/db";
import { bots, type BotInsert } from "@/db/schema";
import { InternalServerException } from "@/utils/app-error";

export async function createBot(userId: string, data: BotInsert) {
  const [bot] = await db.insert(bots).values({
    ...data,
    userId,
    instructions: data.instructions || null,
  }).returning();

  if (!bot) throw new InternalServerException("Could not create the bot.");
  return bot;
}
