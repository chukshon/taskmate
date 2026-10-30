import type { ValidationIssue } from "@/types/api-response"

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly errors: ValidationIssue[] = []
  ) {
    super(message)
    this.name = "ApiError"
  }
}
