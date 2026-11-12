import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { convertToModelMessages, simulateReadableStream, streamText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { configureClerkTestEnvironment } from "./helpers/clerk.js";

const token = configureClerkTestEnvironment();
const { env } = await import("@/config/env.config");
const { sendChatMessageHandler } = await import("@/controllers/chat-message.controller");
const { sendChatMessageRequest } = await import("@/validators/chat-message.validator");
const { requireSession } = await import("@/middlewares/requireSession.middleware");
const { validateRequest } = await import("@/middlewares/validateRequest.middleware");
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");
const { NotFoundException } = await import("@/utils/app-error");
let lookups = 0;
let generations = 0;
let lastSelection: { provider: string; model: string } | undefined;
const model = new MockLanguageModelV4({
  doStream: async () => ({
    stream: simulateReadableStream({ initialDelayInMs: null, chunkDelayInMs: null, chunks: [
      { type: "text-start", id: "text-1" },
      { type: "text-delta", id: "text-1", delta: "Hello from your bot!" },
      { type: "text-end", id: "text-1" },
      { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 5, text: 5, reasoning: undefined },
      } },
    ] }),
  }),
});
const app = express();
app.use(express.json());
app.use(clerkMiddleware({ publishableKey: env.CLERK_PUBLISHABLE_KEY, secretKey: env.CLERK_SECRET_KEY, jwtKey: env.CLERK_JWT_KEY, authorizedParties: [env.CLIENT_ORIGIN] }));
app.post("/chats/:chatId/messages", requireSession, validateRequest(sendChatMessageRequest), sendChatMessageHandler(async (userId, chatId) => {
  lookups++;
  assert.equal(userId, "user_taskmate_test");
  if (chatId !== "owned-chat") throw new NotFoundException("Chat not found.");
  return { id: chatId, kind: "direct", name: null, lastMessagePreview: null, lastMessageAt: new Date(), createdAt: new Date(), bots: [{ id: "bot-1", name: "Ada", avatar: "ada", job: "Tutor", instructions: null }] };
}, async (_chat, messages, signal, selection) => {
  generations++;
  lastSelection = selection;
  if (messages[0].parts.some((part) => part.type === "text" && part.text === "Fail")) {
    throw new Error("Private provider credentials and details");
  }
  if (messages[0].parts.some((part) => part.type === "text" && part.text === "Stream fail")) {
    return streamText({
      model: new MockLanguageModelV4({ doStream: async () => { throw new Error("Private streaming provider details"); } }),
      messages: await convertToModelMessages(messages),
      maxRetries: 0,
      onError: () => {},
    });
  }
  return streamText({ model, messages: await convertToModelMessages(messages), abortSignal: signal });
}));
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
let baseUrl: string;
before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
const message = { id: "message-1", role: "user", parts: [{ type: "text", text: "Hello" }] };
const send = (
  messages: unknown,
  authenticated = true,
  chatId = "owned-chat",
  selection?: { provider?: string; model?: string },
) => fetch(`${baseUrl}/chats/${chatId}/messages?userId=attacker`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(authenticated ? { Authorization: `Bearer ${token()}` } : {}),
  },
  body: JSON.stringify({ messages, ...selection }),
});

test("chat streaming requires authentication before validation or generation", async () => {
  const previous = lookups;
  assert.equal((await send([], false)).status, 401);
  assert.equal(lookups, previous);
});

test("chat streaming validates text-only history and rejects injected system instructions", async () => {
  const previous = generations;
  for (const messages of [[], [{ ...message, role: "system" }], [{ ...message, parts: [{ type: "text", text: " " }] }], [{ ...message, parts: [{ type: "file", url: "https://example.com/file" }] }]]) {
    assert.equal((await send(messages)).status, 400);
  }
  assert.equal(generations, previous);
});

test("an unavailable chat does not call the model", async () => {
  const previous = generations;
  assert.equal((await send([message], true, "someone-elses-chat")).status, 404);
  assert.equal(generations, previous);
});

test("owned chats return AI SDK SSE events and accept conversation history", async () => {
  const response = await send([message, { ...message, id: "reply-1", role: "assistant", parts: [{ type: "text", text: "Previous reply" }] }, { ...message, id: "message-2" }]);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const stream = await response.text();
  assert.match(stream, /Hello from your bot!/);
  assert.match(stream, /text-delta/);
  assert.match(stream, /\[DONE\]/);
  assert.equal(model.doStreamCalls.at(-1)?.prompt.length, 3);
  assert.deepEqual(lastSelection, { provider: "google", model: "auto" });
});

test("chat streaming rejects unsupported provider and model combinations", async () => {
  const previous = generations;
  assert.equal((await send([message], true, "owned-chat", { provider: "openai", model: "not-a-model" })).status, 400);
  assert.equal((await send([message], true, "owned-chat", { provider: "unknown", model: "auto" })).status, 400);
  assert.equal(generations, previous);
});

test("chat streaming forwards a supported provider and model selection", async () => {
  const response = await send([message], true, "owned-chat", {
    provider: "anthropic",
    model: "claude-haiku-5-5",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(lastSelection, { provider: "anthropic", model: "claude-haiku-5-5" });
});

test("provider setup errors do not expose private details", async () => {
  const response = await send([{ ...message, parts: [{ type: "text", text: "Fail" }] }]);
  assert.equal(response.status, 500);
  assert.ok(!(await response.text()).includes("Private provider"));
});

test("provider errors after streaming starts return a safe error event", async () => {
  const response = await send([{ ...message, parts: [{ type: "text", text: "Stream fail" }] }]);
  const stream = await response.text();
  assert.match(stream, /Could not generate a reply/);
  assert.ok(!stream.includes("Private streaming provider"));
});
