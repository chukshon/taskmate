import assert from "node:assert/strict";
import { after, afterEach, mock, test } from "node:test";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, pool } from "@/db";
import { bots, chats, chatMembers } from "@/db/schema";
import { createBot, updateBot, deleteBot } from "@/services/bot.service";

const userId = `user_transaction_test_${nanoid()}`;
const input = { name: "Transaction test", job: "Tutor", avatar: "chosen-face", instructions: "" };
const transaction = db.transaction.bind(db);

const stubSandbox = {
  createSandbox: async (botId: string) => `sandbox_for_${botId}`,
  removeSandbox: async () => {},
};

afterEach(async () => {
  mock.restoreAll();
  await db.delete(chats).where(eq(chats.userId, userId));
  await db.delete(bots).where(eq(bots.userId, userId));
});
after(async () => { await pool.end(); });

test("bot creation persists a direct chat and membership with the same owner", async () => {
  const bot = await createBot(userId, input, stubSandbox);
  assert.equal(bot.userId, userId);
  assert.equal(bot.avatar, input.avatar);
  assert.equal(bot.instructions, null);
  assert.equal(bot.sandboxId, `sandbox_for_${bot.id}`);

  const memberships = await db.query.chatMembers.findMany({
    where: eq(chatMembers.botId, bot.id),
    with: { chat: true, bot: true },
  });
  assert.equal(memberships.length, 1);
  assert.equal(memberships[0].bot.id, bot.id);
  assert.equal(memberships[0].chat.userId, userId);
  assert.equal(memberships[0].chat.kind, "direct");
  assert.equal(memberships[0].chat.name, null);
});

test("bot updates enforce ownership and preserve the existing chat and generated fields", async () => {
  const bot = await createBot(userId, input, stubSandbox);
  await db.update(bots).set({ sandboxId: "existing-sandbox" }).where(eq(bots.id, bot.id));
  const memberships = await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) });
  await assert.rejects(updateBot("another-user", bot.id, { ...input, name: "Unauthorized" }), { statusCode: 404 });
  const updated = await updateBot(userId, bot.id, { name: "Updated bot", job: "Editor", avatar: "new-face", instructions: "" });
  assert.equal(updated.name, "Updated bot");
  assert.equal(updated.avatar, "new-face");
  assert.equal(updated.job, "Editor");
  assert.equal(updated.instructions, null);
  assert.equal(updated.id, bot.id);
  assert.equal(updated.userId, userId);
  assert.equal(updated.sandboxId, "existing-sandbox");
  assert.equal(updated.createdAt.toISOString(), bot.createdAt.toISOString());
  assert.deepEqual(await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) }), memberships);
  assert.equal((await db.select().from(chats).where(eq(chats.userId, userId))).length, 1);
});

test("bot deletion removes its direct chat and memberships but preserves other bots and group chats", async () => {
  const bot = await createBot(userId, input, stubSandbox);
  const otherBot = await createBot(userId, { ...input, name: "Keep this bot" }, stubSandbox);
  const [membership] = await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) });
  const [group] = await db.insert(chats).values({ userId, kind: "group", name: "Keep this group" }).returning();
  await db.insert(chatMembers).values([{ chatId: group.id, botId: bot.id }, { chatId: group.id, botId: otherBot.id }]);
  const removed: string[] = [];
  await assert.rejects(deleteBot("another-user", bot.id, async () => {}), { statusCode: 404 });
  assert.ok(await db.query.bots.findFirst({ where: eq(bots.id, bot.id) }));
  const result = await deleteBot(userId, bot.id, async (sandboxId) => {
    if (sandboxId) removed.push(sandboxId);
  });
  assert.deepEqual(removed, [`sandbox_for_${bot.id}`]);
  assert.deepEqual(result, { id: bot.id, deletedChatIds: [membership.chatId] });
  assert.equal(await db.query.bots.findFirst({ where: eq(bots.id, bot.id) }), undefined);
  assert.equal(await db.query.chats.findFirst({ where: eq(chats.id, membership.chatId) }), undefined);
  assert.deepEqual(await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) }), []);
  assert.ok(await db.query.bots.findFirst({ where: eq(bots.id, otherBot.id) }));
  const groupMembers = await db.query.chatMembers.findMany({ where: eq(chatMembers.chatId, group.id) });
  assert.deepEqual(groupMembers.map(({ botId }) => botId), [otherBot.id]);
  await assert.rejects(deleteBot(userId, bot.id, async () => {}), { statusCode: 404 });
});

test("a bot deletion failure rolls back its direct chat deletion", async () => {
  const bot = await createBot(userId, input, stubSandbox);
  const [membership] = await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) });
  const failure = new Error("Injected delete failure");
  mock.method(db, "transaction", (callback: Parameters<typeof db.transaction>[0]) => transaction(async (tx) => {
    const remove = tx.delete.bind(tx);
    mock.method(tx, "delete", (table: Parameters<typeof tx.delete>[0]) => {
      if (table === bots) throw failure;
      return remove(table);
    });
    return callback(tx);
  }));
  await assert.rejects(deleteBot(userId, bot.id, async () => {}), (error) => error === failure);
  assert.ok(await db.query.bots.findFirst({ where: eq(bots.id, bot.id) }));
  assert.ok(await db.query.chats.findFirst({ where: eq(chats.id, membership.chatId) }));
  assert.equal((await db.query.chatMembers.findMany({ where: eq(chatMembers.botId, bot.id) })).length, 1);
});

test("a failed bot create cleans up the provisioned sandbox", async () => {
  const failure = new Error("Injected chat write failure");
  const cleaned: string[] = [];
  mock.method(db, "transaction", (callback: Parameters<typeof db.transaction>[0]) => transaction(async (tx) => {
    const insert = tx.insert.bind(tx);
    mock.method(tx, "insert", (table: Parameters<typeof tx.insert>[0]) => {
      if (table === chats) throw failure;
      return insert(table);
    });
    return callback(tx);
  }));

  await assert.rejects(
    createBot(userId, input, {
      createSandbox: async (botId) => `sandbox_for_${botId}`,
      removeSandbox: async (sandboxId) => {
        if (sandboxId) cleaned.push(sandboxId);
      },
    }),
    (error) => error === failure,
  );
  assert.equal((await db.select().from(bots).where(eq(bots.userId, userId))).length, 0);
  assert.equal(cleaned.length, 1);
  assert.match(cleaned[0], /^sandbox_for_/);
});

for (const [name, failedTable] of [["chat", chats], ["membership", chatMembers]] as const) {
  test(`a ${name} write failure rolls back all bot creation records`, async () => {
    const failure = new Error(`Injected ${name} write failure`);
    mock.method(db, "transaction", (callback: Parameters<typeof db.transaction>[0]) => transaction(async (tx) => {
      const insert = tx.insert.bind(tx);
      mock.method(tx, "insert", (table: Parameters<typeof tx.insert>[0]) => {
        if (table === failedTable) throw failure;
        return insert(table);
      });
      return callback(tx);
    }));

    await assert.rejects(createBot(userId, input, stubSandbox), (error) => error === failure);
    assert.equal((await db.select().from(bots).where(eq(bots.userId, userId))).length, 0);
    assert.equal((await db.select().from(chats).where(eq(chats.userId, userId))).length, 0);
  });
}
