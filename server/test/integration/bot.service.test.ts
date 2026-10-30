import assert from "node:assert/strict";
import { after, afterEach, mock, test } from "node:test";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, pool } from "@/db";
import { bots, chats, chatMembers } from "@/db/schema";
import { createBot } from "@/services/bot.service";

const userId = `user_transaction_test_${nanoid()}`;
const input = { name: "Transaction test", job: "Tutor", avatar: "chosen-face", instructions: "" };
const transaction = db.transaction.bind(db);

afterEach(async () => {
  mock.restoreAll();
  await db.delete(chats).where(eq(chats.userId, userId));
  await db.delete(bots).where(eq(bots.userId, userId));
});
after(async () => { await pool.end(); });

test("bot creation persists a direct chat and membership with the same owner", async () => {
  const bot = await createBot(userId, input);
  assert.equal(bot.userId, userId);
  assert.equal(bot.avatar, input.avatar);
  assert.equal(bot.instructions, null);
  assert.equal(bot.sandboxId, null);

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

    await assert.rejects(createBot(userId, input), (error) => error === failure);
    assert.equal((await db.select().from(bots).where(eq(bots.userId, userId))).length, 0);
    assert.equal((await db.select().from(chats).where(eq(chats.userId, userId))).length, 0);
  });
}
