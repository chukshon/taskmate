import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { configureClerkTestEnvironment } from "./helpers/clerk.js";

const token = configureClerkTestEnvironment();
const { createApp } = await import("@/app");
const server = createApp().listen(0, "127.0.0.1");
let baseUrl: string;

before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

async function expectUnauthorized(value?: string) {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: value ? { Authorization: `Bearer ${value}` } : {},
    redirect: "manual",
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(await response.json(), {
    success: false, message: "Sign in to continue.", errorCode: "ERR_UNAUTHORIZED",
  });
}

test("protected endpoint returns JSON 401 without a session", () => expectUnauthorized());
test("rejects malformed bearer tokens", () => expectUnauthorized("not-a-token"));
test("rejects expired sessions", () => expectUnauthorized(token({ exp: Math.floor(Date.now() / 1000) - 60 })));
test("rejects tokens issued to an untrusted frontend", () => expectUnauthorized(token({ azp: "https://untrusted.example" })));
test("rejects tokens with a tampered payload", () => {
  const [header, , signature] = token().split(".");
  const payload = Buffer.from(JSON.stringify({ sub: "user_attacker" })).toString("base64url");
  return expectUnauthorized(`${header}.${payload}.${signature}`);
});
test("pending sessions cannot access protected data", () => expectUnauthorized(token({ sts: "pending" })));

test("verified session supplies identity regardless of browser-provided user IDs", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me?userId=user_attacker`, {
    headers: { Authorization: `Bearer ${token()}`, "x-user-id": "user_attacker" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    success: true, message: "Authenticated",
    data: { userId: "user_taskmate_test", sessionId: "sess_taskmate_test" },
  });
});

test("CORS preflight works before authentication", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3000", "access-control-request-method": "GET",
      "access-control-request-headers": "authorization",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.equal(response.headers.get("access-control-allow-headers"), "authorization");
});

test("health stays public", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "taskmate-server" });
});
