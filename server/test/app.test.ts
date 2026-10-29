import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import { z } from "zod";
import { configureClerkTestEnvironment } from "./helpers/clerk.js";

configureClerkTestEnvironment();
const { createApp } = await import("@/app");
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");

const server = createApp().listen(0, "127.0.0.1");
let baseUrl: string;

before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test("health endpoint responds with JSON and security headers", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "taskmate-server" });
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("unknown routes return a consistent JSON 404", async () => {
  const response = await fetch(`${baseUrl}/missing`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, errorCode: "ERR_NOT_FOUND", message: "Route not found" });
});

test("malformed JSON returns 400 without echoing request data", async () => {
  const response = await fetch(`${baseUrl}/missing`, { method: "POST", headers: { "content-type": "application/json" }, body: "{secret-value" });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { success: false, errorCode: "ERR_BAD_REQUEST", message: "Request body must be valid JSON" });
});

test("CORS permits the configured frontend origin", async () => {
  const response = await fetch(`${baseUrl}/health`, { headers: { origin: "http://localhost:3000" } });
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
});

test("API rate limiting leaves the health endpoint available", async () => {
  for (let request = 0; request < 100; request++) {
    const response = await fetch(`${baseUrl}/api/v1/missing`);
    assert.equal(response.status, 404);
    await response.arrayBuffer();
  }
  const limited = await fetch(`${baseUrl}/api/v1/missing`);
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), {
    success: false, errorCode: "ERR_TOO_MANY_REQUESTS", message: "Too many requests. Try again later.",
  });

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("ratelimit"), null);
  await health.arrayBuffer();
});

test("unexpected async errors return 500 without exposing internal details", async () => {
  const app = express();
  app.get("/fail", async () => { throw new Error("private implementation detail"); });
  app.get("/invalid", () => { z.object({ name: z.string() }).parse({}); });
  app.use(errorHandler);
  const failingServer = app.listen(0, "127.0.0.1");
  await once(failingServer, "listening");
  try {
    const response = await fetch(`http://127.0.0.1:${(failingServer.address() as AddressInfo).port}/fail`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, errorCode: "ERR_INTERNAL", message: "Internal server error" });

    const invalid = await fetch(`http://127.0.0.1:${(failingServer.address() as AddressInfo).port}/invalid`);
    assert.equal(invalid.status, 400);
    const body = await invalid.json();
    assert.equal(body.success, false);
    assert.equal(body.errorCode, "ERR_VALIDATION");
    assert.equal(body.errors[0].field, "name");
  } finally {
    await new Promise<void>((resolve, reject) => failingServer.close((error) => error ? reject(error) : resolve()));
  }
});
