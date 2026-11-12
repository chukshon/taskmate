import type { getChatRequest } from "@/validators/chat.validator";
import type {
  createGroupChatRequest,
  deleteGroupChatRequest,
  updateGroupChatRequest,
} from "@/validators/group-chat.validator";
import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import {
  createGroupChat,
  deleteGroupChat,
  getChat,
  getChatDesktopUrl,
  getChats,
  updateGroupChat,
} from "@/services/chat.service";
import { getSuccessResponse } from "@/utils/api-response";
import { HTTP_STATUS } from "@/config/http-status.config";
import type { Request, RequestHandler } from "express";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";

type ChatHandler = RequestHandler<Request["params"], unknown, unknown, Request["query"], SessionLocals & ValidatedLocals<typeof getChatRequest>>;

type CreateGroupChatHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof createGroupChatRequest>
>;

type UpdateGroupChatHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof updateGroupChatRequest>
>;

type DeleteGroupChatHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof deleteGroupChatRequest>
>;

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

export function createGroupChatHandler(
  saveGroupChat = createGroupChat,
): CreateGroupChatHandler {
  return async (_req, res) => {
    const chat = await saveGroupChat(
      res.locals.session.userId,
      res.locals.validated.body,
    );
    res.setHeader("Cache-Control", "no-store");
    res
      .status(HTTP_STATUS.CREATED)
      .json(getSuccessResponse(chat, "Group chat created."));
  };
}

export function updateGroupChatHandler(
  saveGroupChat = updateGroupChat,
): UpdateGroupChatHandler {
  return async (_req, res) => {
    const { params, body } = res.locals.validated;
    const chat = await saveGroupChat(
      res.locals.session.userId,
      params.chatId,
      body,
    );
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(chat, "Group chat updated."));
  };
}

export function deleteGroupChatHandler(
  removeGroupChat = deleteGroupChat,
): DeleteGroupChatHandler {
  return async (_req, res) => {
    const { chatId } = res.locals.validated.params;
    const chat = await removeGroupChat(res.locals.session.userId, chatId);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(chat, "Group chat deleted."));
  };
}

export function getChatDesktopUrlHandler(
  resolveDesktopUrl = getChatDesktopUrl,
): ChatHandler {
  return async (_req, res) => {
    const { chatId } = res.locals.validated.params;
    const url = await resolveDesktopUrl(res.locals.session.userId, chatId);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse({ url }, "Desktop URL retrieved."));
  };
}
