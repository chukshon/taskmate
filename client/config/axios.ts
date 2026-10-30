import axios from "axios"

import { ApiError } from "@/lib/api-error"
import type { ValidationIssue } from "@/types/api-response"

export const api = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "")}/api/v1`,
  timeout: 15_000,
  headers: { Accept: "application/json" },
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const body: unknown = error.response?.data
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : error.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : error.response
            ? "The API request failed. Please try again."
            : "Could not reach the API. Check your connection and try again."
    const issues: unknown =
      body && typeof body === "object" && "errors" in body ? body.errors : []
    const errors = Array.isArray(issues)
      ? issues.filter(
          (issue): issue is ValidationIssue =>
            typeof issue === "object" &&
            issue !== null &&
            typeof issue.field === "string" &&
            typeof issue.message === "string"
        )
      : []

    return Promise.reject(new ApiError(message, error.response?.status, errors))
  }
)
