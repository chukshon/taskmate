import { Router } from "express";
import { getChatHandler, getChatRequest, getChatsHandler } from "@/controllers/chat.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";

export const chatRoutes = Router();
chatRoutes.get("/", requireSession, getChatsHandler());
chatRoutes.get("/:chatId", requireSession, validateRequest(getChatRequest), getChatHandler());
