import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, pool } from "@/db";
import { bots, chatMembers, chats } from "@/db/schema";
import { createBot } from "@/services/bot.service";
import { getChat, getChats } from "@/services/chat.service";

const owner = `user_chat_test_${nanoid()}`;
const otherOwner = `user_other_chat_test_${nanoid()}`;
const input = { name: "My bot", job: "Tutor", avatar: "test-avatar", instructions: "Private instructions" };

afterEach(async () => {
  await db.delete(chats).where(inArray(chats.userId, [owner, otherOwner]));
  await db.delete(bots).where(inArray(bots.userId, [owner, otherOwner]));
});
after(async () => { await pool.end(); });

test("chat listing isolates users and returns only sidebar bot fields", async () => {
  const ownBot = await createBot(owner, input);
  const otherBot = await createBot(otherOwner, { ...input, name: "Other user's bot" });
  const result = await getChats(owner);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].bots, [{ id: ownBot.id, name: ownBot.name, avatar: ownBot.avatar }]);
  assert.ok(!JSON.stringify(result).includes(otherBot.id));
  assert.ok(!JSON.stringify(result).includes(input.instructions));
});

test("chat listing orders by latest activity and carries the preview", async () => {
  const older = await createBot(owner, { ...input, name: "Older bot" });
  await db.update(chats).set({ lastMessageAt: new Date("2020-01-01T00:00:00Z"), lastMessagePreview: "An older message" }).where(eq(chats.userId, owner));
  const newer = await createBot(owner, { ...input, name: "Newer bot" });
  const result = await getChats(owner);
  assert.equal(result[0].bots[0].id, newer.id);
  assert.equal(result[1].bots[0].id, older.id);
  assert.equal(result[1].lastMessagePreview, "An older message");
});

test("empty chats and foreign-owner memberships do not expose other users' bots", async () => {
  const foreignBot = await createBot(otherOwner, input);
  const [chat] = await db.insert(chats).values({ userId: owner }).returning();
  await db.insert(chatMembers).values({ chatId: chat.id, botId: foreignBot.id });
  await db.insert(chats).values({ userId: owner });
  assert.deepEqual(await getChats(owner), []);
});

test("chat detail returns an owned chat and hides it from another user", async () => {
  const bot = await createBot(owner, input);
  const [chat] = await getChats(owner);
  const result = await getChat(owner, chat.id);
  assert.equal(result.id, chat.id);
  assert.deepEqual(result.bots, [{ id: bot.id, name: bot.name, avatar: bot.avatar }]);
  assert.ok(!JSON.stringify(result).includes(input.instructions));
  await assert.rejects(getChat(otherOwner, chat.id), { statusCode: 404 });
  await assert.rejects(getChat(owner, nanoid()), { statusCode: 404 });
});
