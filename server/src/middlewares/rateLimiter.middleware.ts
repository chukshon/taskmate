import { rateLimit } from "express-rate-limit";
import { ErrorCodes } from "@/utils/app-error";
import { getErrorResponse } from "@/utils/api-response";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: getErrorResponse({ errorCode: ErrorCodes.ERR_TOO_MANY_REQUESTS, message: "Too many requests. Try again later." }),
});
