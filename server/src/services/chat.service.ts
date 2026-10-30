import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMembers, chats } from "@/db/schema";

export async function getChats(userId: string) {
  const rows = await db.query.chats.findMany({
    columns: {
      id: true, kind: true, name: true, lastMessagePreview: true,
      lastMessageAt: true, createdAt: true,
    },
    where: eq(chats.userId, userId),
    orderBy: [desc(chats.lastMessageAt), desc(chats.id)],
    with: {
      members: {
        columns: {},
        orderBy: [asc(chatMembers.joinedAt), asc(chatMembers.botId)],
        with: { bot: { columns: { id: true, name: true, avatar: true, userId: true } } },
      },
    },
  });

  return rows.flatMap(({ members, ...chat }) => {
    const bots = members
      .filter(({ bot }) => bot.userId === userId)
      .map(({ bot }) => ({ id: bot.id, name: bot.name, avatar: bot.avatar }));
    return bots.length ? [{ ...chat, bots }] : [];
  });
}
