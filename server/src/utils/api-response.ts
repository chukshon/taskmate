import type { ErrorResponse, SuccessResponse } from "@/types/api-response";

export function getSuccessResponse<T>(
  data: T,
  message = "Success",
): SuccessResponse<T> {
  return { success: true, message, data };
}

export function getErrorResponse({
  message,
  errorCode,
  errors,
}: Omit<ErrorResponse, "success">): ErrorResponse {
  return {
    success: false,
    message,
    errorCode,
    ...(errors !== undefined ? { errors } : {}),
  };
}
