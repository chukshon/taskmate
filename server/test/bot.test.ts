import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { configureClerkTestEnvironment } from "./helpers/clerk.js";

const token = configureClerkTestEnvironment();
const { env } = await import("@/config/env.config");
const { botInsertSchema } = await import("@/db/schema");
const { createBotHandler, createBotRequest, updateBotHandler, updateBotRequest } = await import("@/controllers/bot.controller");
const { NotFoundException } = await import("@/utils/app-error");
const { requireSession } = await import("@/middlewares/requireSession.middleware");
const { validateRequest } = await import("@/middlewares/validateRequest.middleware");
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");

let saves = 0;
const app = express();
app.use(express.json());
app.use(clerkMiddleware({
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
  jwtKey: env.CLERK_JWT_KEY,
  authorizedParties: [env.CLIENT_ORIGIN],
}));
app.put("/bots/:botId", requireSession, validateRequest(updateBotRequest), updateBotHandler(async (userId, botId, data) => {
  saves++;
  if (botId !== "owned-bot") throw new NotFoundException("Bot not found.");
  return { ...data, id: botId, userId, instructions: data.instructions || null, sandboxId: null, createdAt: new Date("2026-10-30T00:00:00Z") };
}));
app.post("/bots", requireSession, validateRequest(createBotRequest), createBotHandler(async (userId, data) => {
  saves++;
  if (data.name === "Fail") throw new Error("Private database details");
  return {
    ...data, id: "generated_id", userId, avatar: data.avatar ?? "generated_avatar",
    instructions: data.instructions || null, sandboxId: null, createdAt: new Date("2026-10-30T00:00:00Z"),
  };
}));
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
let baseUrl: string;
before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

async function submit(body: unknown, authenticated = true) {
  return fetch(`${baseUrl}/bots`, {
    method: "POST", headers: {
      "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token()}` } : {}),
    }, body: JSON.stringify(body),
  });
}

test("bot creation requires authentication before validating or saving", async () => {
  const previous = saves;
  const response = await submit({}, false);
  assert.equal(response.status, 401);
  assert.equal(saves, previous);
});

test("invalid fields produce structured validation errors without saving", async () => {
  const previous = saves;
  const response = await submit({ name: "  ", job: "", avatar: "" });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.errorCode, "ERR_VALIDATION");
  assert.ok(body.errors.some((error: { field: string }) => error.field === "body.name"));
  assert.equal(saves, previous);
});

test("creation trims input and takes identity and generated fields from the server", async () => {
  const response = await submit({
    name: " Ada ", job: " Research assistant ", avatar: "chosen-face", instructions: " Cite sources. ",
    userId: "user_attacker", id: "attacker_id", sandboxId: "attacker_sandbox", createdAt: "2000-01-01",
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.name, "Ada");
  assert.equal(body.data.job, "Research assistant");
  assert.equal(body.data.instructions, "Cite sources.");
  assert.equal(body.data.avatar, "chosen-face");
  assert.equal(body.data.userId, "user_taskmate_test");
  assert.equal(body.data.id, "generated_id");
  assert.equal(body.data.sandboxId, null);
});

test("optional instructions and avatar can be omitted", async () => {
  const response = await submit({ name: "Ada", job: "Tutor" });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.data.instructions, null);
  assert.equal(body.data.avatar, "generated_avatar");
});

test("derived insert schema enforces field lengths", () => {
  assert.equal(botInsertSchema.safeParse({ name: "a".repeat(51), job: "Tutor" }).success, false);
  assert.equal(botInsertSchema.safeParse({ name: "Ada", job: "a".repeat(101) }).success, false);
  assert.equal(botInsertSchema.safeParse({ name: "Ada", job: "Tutor", instructions: "a".repeat(4001) }).success, false);
});

test("save failures use the shared error envelope without exposing database details", async () => {
  const response = await submit({ name: "Fail", job: "Tutor" });
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.errorCode, "ERR_INTERNAL");
  assert.ok(!JSON.stringify(body).includes("Private database details"));
});

async function update(body: unknown, authenticated = true, botId = "owned-bot") {
  return fetch(`${baseUrl}/bots/${botId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token()}` } : {}) },
    body: JSON.stringify(body),
  });
}

test("updating bots authenticates before validating or saving", async () => {
  const previous = saves;
  assert.equal((await update({}, false)).status, 401);
  assert.equal(saves, previous);
});

test("updating bots requires all editable fields and rejects invalid input", async () => {
  const previous = saves;
  assert.equal((await update({ name: "Ada", job: "Tutor" })).status, 400);
  assert.equal((await update({ name: " ", job: "Tutor", avatar: "face", instructions: "" })).status, 400);
  assert.equal(saves, previous);
});

test("updating bots trims values and strips server-controlled fields", async () => {
  const response = await update({ name: " Updated ", job: " Tutor ", avatar: " face ", instructions: "", id: "attacker", userId: "attacker", sandboxId: "attacker" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const { data } = await response.json();
  assert.equal(data.id, "owned-bot");
  assert.equal(data.userId, "user_taskmate_test");
  assert.equal(data.name, "Updated");
  assert.equal(data.avatar, "face");
  assert.equal(data.instructions, null);
  assert.equal(data.sandboxId, null);
});

test("updating an unavailable bot returns not found", async () => {
  const response = await update({ name: "Ada", job: "Tutor", avatar: "face", instructions: "" }, true, "missing");
  assert.equal(response.status, 404);
});
