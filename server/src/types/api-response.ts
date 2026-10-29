import type { ErrorCodeType } from "@/utils/app-error";

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: ErrorCodeType;
  errors?: ValidationIssue[];
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
