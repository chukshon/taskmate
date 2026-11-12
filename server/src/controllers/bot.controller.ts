import type { Request, RequestHandler } from "express";
import { HTTP_STATUS } from "@/config/http-status.config";
import { botInsertSchema, botFormSchema } from "@/db/schema";
import { z } from "zod";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";
import { createBot, updateBot, deleteBot } from "@/services/bot.service";
import { getSuccessResponse } from "@/utils/api-response";

export const createBotRequest = { body: botInsertSchema };
export const updateBotRequest = {
  params: z.object({ botId: z.string().min(1).max(128) }),
  body: botFormSchema,
};
export const deleteBotRequest = { params: updateBotRequest.params };

type DeleteBotHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof deleteBotRequest>
>;

export function deleteBotHandler(removeBot = deleteBot): DeleteBotHandler {
  return async (_req, res) => {
    const result = await removeBot(
      res.locals.session.userId,
      res.locals.validated.params.botId,
    );
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(result, "Bot deleted."));
  };
}

type UpdateBotHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof updateBotRequest>
>;

export function updateBotHandler(saveBot = updateBot): UpdateBotHandler {
  return async (_req, res) => {
    const { params, body } = res.locals.validated;
    const bot = await saveBot(res.locals.session.userId, params.botId, body);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(bot, "Bot updated."));
  };
}

type BotHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof createBotRequest>
>;

export function createBotHandler(saveBot = createBot): BotHandler {
  return async (_req, res) => {
    const bot = await saveBot(
      res.locals.session.userId,
      res.locals.validated.body,
    );
    res.setHeader("Cache-Control", "no-store");
    res
      .status(HTTP_STATUS.CREATED)
      .json(getSuccessResponse(bot, "Bot created."));
  };
}
