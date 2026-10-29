import { HTTP_STATUS } from "@/config/http-status.config";

export const ErrorCodes = {
  ERR_INTERNAL: "ERR_INTERNAL",
  ERR_BAD_REQUEST: "ERR_BAD_REQUEST",
  ERR_UNAUTHORIZED: "ERR_UNAUTHORIZED",
  ERR_FORBIDDEN: "ERR_FORBIDDEN",
  ERR_NOT_FOUND: "ERR_NOT_FOUND",
  ERR_VALIDATION: "ERR_VALIDATION",
  ERR_TOO_MANY_REQUESTS: "ERR_TOO_MANY_REQUESTS",
} as const;

export type ErrorCodeType = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCodeType,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal server error") {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL, message);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Route not found") {
    super(HTTP_STATUS.NOT_FOUND, ErrorCodes.ERR_NOT_FOUND, message);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad request") {
    super(HTTP_STATUS.BAD_REQUEST, ErrorCodes.ERR_BAD_REQUEST, message);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(HTTP_STATUS.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED, message);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden") {
    super(HTTP_STATUS.FORBIDDEN, ErrorCodes.ERR_FORBIDDEN, message);
  }
}
