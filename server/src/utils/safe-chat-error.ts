import {
  APICallError,
  LoadAPIKeyError,
  NoSuchModelError,
  RetryError,
} from "ai";
import { USAGE_LIMIT_ERROR } from "@/lib/billing";
import { AppError } from "@/utils/app-error";

export const SAFE_CHAT_ERROR_FALLBACK =
  "Could not generate a reply. Please try again.";

export function toSafeChatErrorMessage(error: unknown): string {
  const mapped = mapSafeChatError(unwrapChatError(error));
  return mapped ?? SAFE_CHAT_ERROR_FALLBACK;
}

export function getSafeChatErrorLog(error: unknown) {
  const unwrapped = unwrapChatError(error);
  return {
    errorType: unwrapped instanceof Error ? unwrapped.name : "UnknownError",
    statusCode: APICallError.isInstance(unwrapped)
      ? unwrapped.statusCode
      : undefined,
  };
}

function unwrapChatError(error: unknown): unknown {
  if (RetryError.isInstance(error)) return unwrapChatError(error.lastError);
  if (error instanceof Error && error.cause != null) {
    return unwrapChatError(error.cause);
  }
  return error;
}

function mapSafeChatError(error: unknown): string | undefined {
  if (error instanceof Error && error.message === USAGE_LIMIT_ERROR) {
    return USAGE_LIMIT_ERROR;
  }

  if (error instanceof AppError && error.statusCode < 500) {
    return error.message;
  }

  if (LoadAPIKeyError.isInstance(error)) {
    return "This AI provider is not configured on the server.";
  }

  if (NoSuchModelError.isInstance(error)) {
    return "The selected model is not available.";
  }

  if (APICallError.isInstance(error)) {
    switch (error.statusCode) {
      case 401:
      case 403:
        return "The AI provider rejected the API key.";
      case 402:
        return "The AI provider rejected the request due to billing or quota.";
      case 404:
        return "The selected model is not available from this provider.";
      case 429:
        return "The AI provider rate limit was hit. Try again shortly.";
      case 400:
        return "The AI provider rejected the request.";
      default:
        if (error.statusCode != null && error.statusCode >= 500) {
          return "The AI provider is temporarily unavailable. Try again shortly.";
        }
    }
  }

  const text =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (/(quota|billing|payment|insufficient.?funds|credit)/.test(text)) {
    return "The AI provider rejected the request due to billing or quota.";
  }
  if (/(rate.?limit|too many requests)/.test(text)) {
    return "The AI provider rate limit was hit. Try again shortly.";
  }
  if (
    /(invalid.?api.?key|incorrect.?api.?key|authentication|unauthorized|forbidden)/.test(
      text,
    )
  ) {
    return "The AI provider rejected the API key.";
  }

  return undefined;
}
