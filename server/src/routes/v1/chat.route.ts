import { getChatRequest } from "@/validators/chat.validator";
import { sendChatMessageRequest } from "@/validators/chat-message.validator";
import { Router } from "express";
import { getChatHandler, getChatsHandler } from "@/controllers/chat.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";
import { sendChatMessageHandler } from "@/controllers/chat-message.controller";

export const chatRoutes = Router();
chatRoutes.get("/", requireSession, getChatsHandler());
chatRoutes.get("/:chatId", requireSession, validateRequest(getChatRequest), getChatHandler());
chatRoutes.post("/:chatId/messages", requireSession, validateRequest(sendChatMessageRequest), sendChatMessageHandler());
