import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import { getChats } from "@/services/chat.service";
import { getSuccessResponse } from "@/utils/api-response";

export function getChatsHandler(listChats = getChats): SessionHandler {
  return async (_req, res) => {
    const chats = await listChats(res.locals.session.userId);
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(chats, "Chats retrieved."));
  };
}
