import { Router } from "express";
import { createBotHandler, createBotRequest, updateBotHandler, updateBotRequest } from "@/controllers/bot.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";

export const botRoutes = Router();
botRoutes.post("/", requireSession, validateRequest(createBotRequest), createBotHandler());
botRoutes.put("/:botId", requireSession, validateRequest(updateBotRequest), updateBotHandler());
