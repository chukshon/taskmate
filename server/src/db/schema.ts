import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { bots } from "@/db/bot-schema";
export { bots, botInsertSchema, botFormSchema, type BotInsert } from "@/db/bot-schema";

export const chatKind = pgEnum("chat_kind", ["direct", "group"]);

export const chats = pgTable(
  "chats",
  {
    id: text().primaryKey().$defaultFn(() => nanoid()),
    userId: text().notNull(),
    kind: chatKind().notNull().default("direct"),
    name: text(),
    lastMessagePreview: text(),
    lastMessageAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("chats_user_id_idx").on(table.userId)],
);

export const chatMembers = pgTable(
  "chat_members",
  {
    chatId: text().notNull().references(() => chats.id, { onDelete: "cascade" }),
    botId: text().notNull().references(() => bots.id, { onDelete: "cascade" }),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.botId] }),
    index("chat_members_bot_id_idx").on(table.botId),
  ],
);

export const botsRelations = relations(bots, ({ many }) => ({
  memberships: many(chatMembers),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, { fields: [chatMembers.chatId], references: [chats.id] }),
  bot: one(bots, { fields: [chatMembers.botId], references: [bots.id] }),
}));

export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatMember = typeof chatMembers.$inferSelect;
export type NewChatMember = typeof chatMembers.$inferInsert;
