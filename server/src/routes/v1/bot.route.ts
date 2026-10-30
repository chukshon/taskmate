import { Router } from "express";
import { createBotHandler, createBotRequest } from "@/controllers/bot.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";
import { validateRequest } from "@/middlewares/validateRequest.middleware";

export const botRoutes = Router();
botRoutes.post("/", requireSession, validateRequest(createBotRequest), createBotHandler());
