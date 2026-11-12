import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { configureClerkTestEnvironment } from "./helpers/clerk.js";

const token = configureClerkTestEnvironment();
const { env } = await import("@/config/env.config");
const { getChatsHandler, getChatHandler } = await import("@/controllers/chat.controller");
const { getChatModelsHandler } = await import("@/controllers/ai-model.controller");
const { getChatRequest } = await import("@/validators/chat.validator");
const { validateRequest } = await import("@/middlewares/validateRequest.middleware");
const { NotFoundException } = await import("@/utils/app-error");
const { requireSession } = await import("@/middlewares/requireSession.middleware");
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");
let requestedOwner: string | undefined;
let calls = 0;
const app = express();
app.use(clerkMiddleware({
  publishableKey: env.CLERK_PUBLISHABLE_KEY, secretKey: env.CLERK_SECRET_KEY,
  jwtKey: env.CLERK_JWT_KEY, authorizedParties: [env.CLIENT_ORIGIN],
}));
app.get("/chats", requireSession, getChatsHandler(async (userId) => {
  requestedOwner = userId;
  calls++;
  return [];
}));
app.get("/chats/models", requireSession, getChatModelsHandler);
app.get("/chats/:chatId", requireSession, validateRequest(getChatRequest), getChatHandler(async (userId, chatId) => {
  requestedOwner = userId;
  calls++;
  if (chatId !== "owned-chat") throw new NotFoundException("Chat not found.");
  return { id: chatId, kind: "direct", name: null, lastMessagePreview: null, lastMessageAt: new Date(), createdAt: new Date(), bots: [{ id: "bot-1", name: "Ada", avatar: "ada", job: "Tutor", instructions: null, sandboxId: null }] };
}));
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
let baseUrl: string;
before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test("listing chats requires authentication before querying", async () => {
  const previous = calls;
  const response = await fetch(`${baseUrl}/chats`);
  assert.equal(response.status, 401);
  assert.equal(calls, previous);
});

test("chat model catalogue requires authentication and returns provider availability", async () => {
  assert.equal((await fetch(`${baseUrl}/chats/models`)).status, 401);
  const response = await fetch(`${baseUrl}/chats/models`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(["google", "openai", "xai", "anthropic"].includes(body.data.defaultProvider));
  assert.equal(body.data.providers.length, 4);
  for (const provider of body.data.providers) {
    assert.equal(typeof provider.name, "string");
    assert.equal(typeof provider.available, "boolean");
    assert.ok(provider.models.length >= 1);
  }
});

test("chat ownership comes from the verified session rather than query parameters", async () => {
  const response = await fetch(`${baseUrl}/chats?userId=user_attacker`, {
    headers: { Authorization: `Bearer ${token()}`, "x-user-id": "user_attacker" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(requestedOwner, "user_taskmate_test");
  assert.deepEqual(await response.json(), { success: true, message: "Chats retrieved.", data: [] });
});

test("chat detail requires authentication before querying", async () => {
  const previous = calls;
  const response = await fetch(`${baseUrl}/chats/owned-chat`);
  assert.equal(response.status, 401);
  assert.equal(calls, previous);
});

test("chat detail uses the session owner and returns a private response", async () => {
  const response = await fetch(`${baseUrl}/chats/owned-chat?userId=user_attacker`, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(requestedOwner, "user_taskmate_test");
  const body = await response.json();
  assert.equal(body.data.id, "owned-chat");
});

test("unavailable chat detail returns 404", async () => {
  const response = await fetch(`${baseUrl}/chats/missing`, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(response.status, 404);
});
