import { Router } from "express";
import { createBotHandler, updateBotHandler, deleteBotHandler } from "@/controllers/bot.controller";
import { createBotRequest, updateBotRequest, deleteBotRequest } from "@/validators/bot.validator";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";

export const botRoutes = Router();
botRoutes.post("/", requireSession, validateRequest(createBotRequest), createBotHandler());
botRoutes.put("/:botId", requireSession, validateRequest(updateBotRequest), updateBotHandler());
botRoutes.delete("/:botId", requireSession, validateRequest(deleteBotRequest), deleteBotHandler());
