import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type { GroupChatInsert } from "@/db/group-chat-schema";
import { bots, chatMembers, chats } from "@/db/schema";
import { getBotDesktopUrl } from "@/services/daytona.service";
import {
  InternalServerException,
  NotFoundException,
} from "@/utils/app-error";

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
        with: {
          bot: {
            columns: {
              id: true,
              name: true,
              avatar: true,
              userId: true,
              job: true,
              instructions: true,
              sandboxId: true,
            },
          },
        },
      },
    },
  });
  if (!row) throw new NotFoundException("Chat not found.");
  const { members, ...chat } = row;
  const bots = members
    .filter(({ bot }) => bot.userId === userId)
    .map(({ bot }) => ({
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      job: bot.job,
      instructions: bot.instructions,
      sandboxId: bot.sandboxId,
    }));
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

/** Websocket URL for the direct-chat bot's Daytona desktop preview. */
export async function getChatDesktopUrl(userId: string, chatId: string) {
  const chat = await getChat(userId, chatId);
  if (chat.kind !== "direct") throw new NotFoundException("Chat not found.");
  const sandboxId = chat.bots[0]?.sandboxId;
  if (!sandboxId) throw new NotFoundException("This bot has no sandbox.");
  return getBotDesktopUrl(sandboxId);
}

export async function createGroupChat(userId: string, values: GroupChatInsert) {
  const botIds = [...new Set(values.botIds)];
  const owned = await db
    .select({ id: bots.id })
    .from(bots)
    .where(and(eq(bots.userId, userId), inArray(bots.id, botIds)));
  if (botIds.length < 2 || owned.length !== botIds.length) {
    throw new NotFoundException("Bot not found.");
  }

  return db.transaction(async (tx) => {
    const [chat] = await tx
      .insert(chats)
      .values({ userId, kind: "group", name: values.name })
      .returning();
    if (!chat) throw new InternalServerException("Could not create the group chat.");

    await tx
      .insert(chatMembers)
      .values(botIds.map((botId) => ({ chatId: chat.id, botId })));

    return chat;
  });
}
