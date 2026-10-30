export type ValidationIssue = { field: string; message: string }

export type ApiResponse<T> =
  | { success: true; message: string; data: T }
  | {
      success: false
      message: string
      errorCode?: string
      errors?: ValidationIssue[]
    }
