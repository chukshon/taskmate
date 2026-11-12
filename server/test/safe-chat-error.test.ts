import assert from "node:assert/strict";
import { test } from "node:test";
import { APICallError, LoadAPIKeyError, NoSuchModelError, RetryError } from "ai";
import { BadRequestException } from "@/utils/app-error";
import {
  SAFE_CHAT_ERROR_FALLBACK,
  getSafeChatErrorLog,
  toSafeChatErrorMessage,
} from "@/utils/safe-chat-error";

test("maps known AI SDK failures to safe user-facing messages", () => {
  assert.equal(
    toSafeChatErrorMessage(new BadRequestException("OpenAI is not configured on the server.")),
    "OpenAI is not configured on the server.",
  );
  assert.equal(
    toSafeChatErrorMessage(new LoadAPIKeyError({ message: "Missing key sk-secret" })),
    "This AI provider is not configured on the server.",
  );
  assert.equal(
    toSafeChatErrorMessage(
      new NoSuchModelError({ modelId: "missing", modelType: "languageModel" }),
    ),
    "The selected model is not available.",
  );
});

test("maps provider HTTP failures without leaking response bodies", () => {
  const unauthorized = new APICallError({
    message: "Unauthorized sk-live-secret",
    url: "https://api.openai.com/v1/responses",
    requestBodyValues: { prompt: "secret prompt" },
    statusCode: 401,
    responseBody: '{"error":{"message":"Incorrect API key sk-live-secret"}}',
  });
  const message = toSafeChatErrorMessage(unauthorized);
  assert.equal(message, "The AI provider rejected the API key.");
  assert.ok(!message.includes("sk-"));
  assert.ok(!message.includes("secret"));

  assert.equal(
    toSafeChatErrorMessage(
      new APICallError({
        message: "Payment required",
        url: "https://api.openai.com/v1/responses",
        requestBodyValues: {},
        statusCode: 402,
      }),
    ),
    "The AI provider rejected the request due to billing or quota.",
  );
  assert.equal(
    toSafeChatErrorMessage(
      new APICallError({
        message: "Too many requests",
        url: "https://api.openai.com/v1/responses",
        requestBodyValues: {},
        statusCode: 429,
      }),
    ),
    "The AI provider rate limit was hit. Try again shortly.",
  );
});

test("unwraps retry errors and falls back safely", () => {
  const retried = new RetryError({
    message: "Failed after retries with sk-live-secret",
    reason: "maxRetriesExceeded",
    errors: [
      new APICallError({
        message: "server boom with sk-live-secret",
        url: "https://api.openai.com/v1/responses",
        requestBodyValues: {},
        statusCode: 503,
      }),
    ],
  });
  assert.equal(
    toSafeChatErrorMessage(retried),
    "The AI provider is temporarily unavailable. Try again shortly.",
  );
  assert.equal(toSafeChatErrorMessage(new Error("totally unknown")), SAFE_CHAT_ERROR_FALLBACK);
  assert.deepEqual(getSafeChatErrorLog(retried), {
    errorType: "AI_APICallError",
    statusCode: 503,
  });
});
