import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HTTP_STATUS } from "@/config/http-status.config";
import { AppError, ErrorCodes, NotFoundException } from "@/utils/app-error";
import { getErrorResponse } from "@/utils/api-response";
import type { ValidationIssue } from "@/types/api-response";
import { logger } from "@/utils/logger";

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new NotFoundException());
};

export function formatZodError(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(getErrorResponse({
      errorCode: ErrorCodes.ERR_VALIDATION,
      message: "Validation failed",
      errors: formatZodError(error),
    }));
    return;
  }

  if (error instanceof AppError && error.statusCode < 500) {
    res.status(error.statusCode).json(getErrorResponse({ errorCode: error.code, message: error.message }));
    return;
  }

  // Body-parser errors contain the raw body: never log or return that object.
  if (error instanceof Error && "type" in error) {
    if (error.type === "entity.parse.failed") {
      res.status(HTTP_STATUS.BAD_REQUEST).json(getErrorResponse({ errorCode: ErrorCodes.ERR_BAD_REQUEST, message: "Request body must be valid JSON" }));
      return;
    }
    if (error.type === "entity.too.large") {
      res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json(getErrorResponse({ errorCode: ErrorCodes.ERR_BAD_REQUEST, message: "Request body is too large" }));
      return;
    }
  }

  logger.error("Unhandled request error", { errorType: error instanceof Error ? error.name : "UnknownError" });
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(getErrorResponse({ errorCode: ErrorCodes.ERR_INTERNAL, message: "Internal server error" }));
};
