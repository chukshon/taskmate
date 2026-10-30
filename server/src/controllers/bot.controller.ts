import type { Request, RequestHandler } from "express";
import { HTTP_STATUS } from "@/config/http-status.config";
import { botInsertSchema } from "@/db/schema";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";
import { createBot } from "@/services/bot.service";
import { getSuccessResponse } from "@/utils/api-response";

export const createBotRequest = { body: botInsertSchema };

type BotHandler = RequestHandler<
  Request["params"], unknown, unknown, Request["query"],
  SessionLocals & ValidatedLocals<typeof createBotRequest>
>;

export function createBotHandler(saveBot = createBot): BotHandler {
  return async (_req, res) => {
    const bot = await saveBot(res.locals.session.userId, res.locals.validated.body);
    res.setHeader("Cache-Control", "no-store");
    res.status(HTTP_STATUS.CREATED).json(getSuccessResponse(bot, "Bot created."));
  };
}
