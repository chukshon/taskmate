import { Router } from "express";
import {
  createBotHandler,
  deleteBotHandler,
  getBotsHandler,
  updateBotHandler,
} from "@/controllers/bot.controller";
import { createBotRequest, updateBotRequest, deleteBotRequest } from "@/validators/bot.validator";
import { requireFeature } from "@/middlewares/requireFeature.middleware";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";

export const botRoutes = Router();
botRoutes.get("/", requireSession, getBotsHandler());
botRoutes.post(
  "/",
  requireSession,
  requireFeature("bots", "sandboxes"),
  validateRequest(createBotRequest),
  createBotHandler(),
);
botRoutes.put("/:botId", requireSession, validateRequest(updateBotRequest), updateBotHandler());
botRoutes.delete("/:botId", requireSession, validateRequest(deleteBotRequest), deleteBotHandler());
