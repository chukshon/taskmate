import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import type { SuccessResponse } from "@/types/api-response";
import { getSuccessResponse } from "@/utils/api-response";
import { ForbiddenException } from "@/utils/app-error";

process.env.NODE_ENV = "test";
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");

const app = express();
app.post("/created", (_req, res: express.Response<SuccessResponse<{ id: number }>>) => {
  res.status(201).json(getSuccessResponse({ id: 1 }, "Item created"));
});
app.get("/empty-data", (_req, res) => res.json(getSuccessResponse(null)));
app.delete("/no-content", (_req, res) => res.status(204).end());
app.get("/forbidden", () => { throw new ForbiddenException("Access denied"); });
app.use(errorHandler);

const server = app.listen(0, "127.0.0.1");
let baseUrl: string;

before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test("success envelopes preserve data and HTTP status", async () => {
  const response = await fetch(`${baseUrl}/created`, { method: "POST" });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, message: "Item created", data: { id: 1 } });
});

test("success responses retain null data and provide a default message", async () => {
  const response = await fetch(`${baseUrl}/empty-data`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, message: "Success", data: null });
});

test("204 responses remain empty", async () => {
  const response = await fetch(`${baseUrl}/no-content`, { method: "DELETE" });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("application errors preserve their HTTP status and omit absent validation details", async () => {
  const response = await fetch(`${baseUrl}/forbidden`);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { success: false, message: "Access denied", errorCode: "ERR_FORBIDDEN" });
});
