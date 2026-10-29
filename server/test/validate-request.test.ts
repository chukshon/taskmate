import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import express from "express";
import { z } from "zod";
import { validateRequest, type ValidatedHandler } from "@/middlewares/validateRequest.middleware";

process.env.NODE_ENV = "test";
const { errorHandler } = await import("@/middlewares/errorHandler.middleware");

const schemas = {
  body: z.object({ name: z.string().trim().min(1) }),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.object({ page: z.coerce.number().int().positive().default(1) }),
};

let controllerCalls = 0;
const controller: ValidatedHandler<typeof schemas> = (req, res) => {
  controllerCalls++;
  const { body, params, query } = res.locals.validated;
  // These assignments also check that coercion output stays typed as numbers.
  const id: number = params.id;
  const page: number = query.page;
  const name: string = body.name;
  res.json({
    validated: { body: { name }, params: { id }, query: { page } },
    raw: { body: req.body, params: req.params, query: req.query },
  });
};

const app = express();
app.use(express.json());
app.post("/items/:id", validateRequest(schemas), controller);
app.post("/async", validateRequest({
  body: z.object({
    name: z.string().refine(async (name) => name !== "taken", { error: "Name is taken" })
      .transform(async (name) => name.toUpperCase()),
  }),
}), (_req, res) => res.json(res.locals.validated));
app.get("/query", validateRequest({ query: schemas.query }), (_req, res) => res.json(res.locals.validated));
app.get("/throw", validateRequest({
  query: z.object({}).transform(() => { throw new Error("private transform failure"); }),
}), (_req, res) => res.sendStatus(204));
app.use(errorHandler);

const server = app.listen(0, "127.0.0.1");
let baseUrl: string;

before(async () => {
  if (!server.listening) await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test("stores transformed output together while preserving raw request inputs", async () => {
  const input = { name: "  Ada  ", ignored: true };
  const response = await fetch(`${baseUrl}/items/7?page=2`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    validated: { body: { name: "Ada" }, params: { id: 7 }, query: { page: 2 } },
    raw: { body: input, params: { id: "7" }, query: { page: "2" } },
  });
});

test("validates only configured sections and applies defaults", async () => {
  const response = await fetch(`${baseUrl}/query`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { query: { page: 1 } });
});

test("returns errors from all sections and never calls the controller on failure", async () => {
  const callsBefore = controllerCalls;
  const response = await fetch(`${baseUrl}/items/invalid?page=0`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: " " }),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, "ERR_VALIDATION");
  assert.deepEqual(body.error.details.map((detail: { field: string }) => detail.field).sort(), ["body.name", "params.id", "query.page"]);
  assert.equal(controllerCalls, callsBefore);
});

test("rejects missing required request bodies", async () => {
  const response = await fetch(`${baseUrl}/items/1`, { method: "POST" });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.details[0].field, "body");
});

test("awaits async refinements and transformations", async () => {
  const valid = await fetch(`${baseUrl}/async`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "ada" }),
  });
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { body: { name: "ADA" } });

  const invalid = await fetch(`${baseUrl}/async`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "taken" }),
  });
  assert.equal(invalid.status, 400);
  const body = await invalid.json();
  assert.deepEqual(body.error.details, [{ field: "body.name", message: "Name is taken" }]);
});

test("forwards unexpected errors without exposing their messages", async () => {
  const response = await fetch(`${baseUrl}/throw`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: { code: "ERR_INTERNAL", message: "Internal server error" } });
});
