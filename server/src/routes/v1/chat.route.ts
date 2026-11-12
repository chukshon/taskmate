import { getChatRequest } from "@/validators/chat.validator";
import {
  loadChatTranscriptRequest,
  mintChatAccessTokenRequest,
  startChatSessionRequest,
} from "@/validators/chat-session.validator";
import { Router } from "express";
import {
  createGroupChatHandler,
  deleteGroupChatHandler,
  getChatDesktopUrlHandler,
  getChatHandler,
  getChatsHandler,
  updateGroupChatHandler,
} from "@/controllers/chat.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";
import {
  loadChatTranscriptHandler,
  mintChatAccessTokenHandler,
  startChatSessionHandler,
} from "@/controllers/chat-session.controller";
import { getChatModelsHandler } from "@/controllers/ai-model.controller";
import {
  createGroupChatRequest,
  deleteGroupChatRequest,
  updateGroupChatRequest,
} from "@/validators/group-chat.validator";

export const chatRoutes = Router();
chatRoutes.get("/", requireSession, getChatsHandler());
chatRoutes.post(
  "/",
  requireSession,
  validateRequest(createGroupChatRequest),
  createGroupChatHandler(),
);
chatRoutes.get("/models", requireSession, getChatModelsHandler);
chatRoutes.get("/:chatId", requireSession, validateRequest(getChatRequest), getChatHandler());
chatRoutes.put(
  "/:chatId",
  requireSession,
  validateRequest(updateGroupChatRequest),
  updateGroupChatHandler(),
);
chatRoutes.delete(
  "/:chatId",
  requireSession,
  validateRequest(deleteGroupChatRequest),
  deleteGroupChatHandler(),
);
chatRoutes.get(
  "/:chatId/desktop",
  requireSession,
  validateRequest(getChatRequest),
  getChatDesktopUrlHandler(),
);
chatRoutes.post(
  "/:chatId/session",
  requireSession,
  validateRequest(startChatSessionRequest),
  startChatSessionHandler(),
);
chatRoutes.post(
  "/:chatId/access-token",
  requireSession,
  validateRequest(mintChatAccessTokenRequest),
  mintChatAccessTokenHandler(),
);
chatRoutes.get(
  "/:chatId/transcript",
  requireSession,
  validateRequest(loadChatTranscriptRequest),
  loadChatTranscriptHandler(),
);
