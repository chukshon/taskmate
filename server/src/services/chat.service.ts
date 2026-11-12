import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMembers, chats } from "@/db/schema";
import { NotFoundException } from "@/utils/app-error";

export async function getChat(userId: string, chatId: string) {
  const row = await db.query.chats.findFirst({
    columns: {
      id: true, kind: true, name: true, lastMessagePreview: true,
      lastMessageAt: true, createdAt: true,
    },
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
    with: {
      members: {
        columns: {},
        orderBy: [asc(chatMembers.joinedAt), asc(chatMembers.botId)],
        with: { bot: { columns: { id: true, name: true, avatar: true, userId: true, job: true, instructions: true } } },
      },
    },
  });
  if (!row) throw new NotFoundException("Chat not found.");
  const { members, ...chat } = row;
  const bots = members
    .filter(({ bot }) => bot.userId === userId)
    .map(({ bot }) => ({ id: bot.id, name: bot.name, avatar: bot.avatar, job: bot.job, instructions: bot.instructions }));
  if (!bots.length) throw new NotFoundException("Chat not found.");
  return { ...chat, bots };
}

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
