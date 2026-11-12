import type { getChatRequest } from "@/validators/chat.validator";
import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import { getChat, getChats } from "@/services/chat.service";
import { getSuccessResponse } from "@/utils/api-response";
import type { Request, RequestHandler } from "express";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";

type ChatHandler = RequestHandler<Request["params"], unknown, unknown, Request["query"], SessionLocals & ValidatedLocals<typeof getChatRequest>>;

export function getChatHandler(findChat = getChat): ChatHandler {
  return async (_req, res) => {
    const { chatId } = res.locals.validated.params;
    const chat = await findChat(res.locals.session.userId, chatId);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(chat, "Chat retrieved."));
  };
}

export function getChatsHandler(listChats = getChats): SessionHandler {
  return async (_req, res) => {
    const chats = await listChats(res.locals.session.userId);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(chats, "Chats retrieved."));
  };
}
