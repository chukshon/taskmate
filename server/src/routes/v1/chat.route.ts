import { Router } from "express";
import { getChatsHandler } from "@/controllers/chat.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";

export const chatRoutes = Router();
chatRoutes.get("/", requireSession, getChatsHandler());
