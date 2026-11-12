import type { sendChatMessageRequest } from "@/validators/chat-message.validator";
import type { Request, RequestHandler } from "express";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";
import { getChat } from "@/services/chat.service";
import { streamChatReply } from "@/services/chat-message.service";

type ChatMessageHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof sendChatMessageRequest>
>;

export function sendChatMessageHandler(
  findChat = getChat,
  generateReply = streamChatReply,
): ChatMessageHandler {
  return async (_req, res) => {
    const { params, body } = res.locals.validated;
    const chat = await findChat(res.locals.session.userId, params.chatId);
    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableFinished) controller.abort();
    };
    res.once("close", onClose);
    res.once("finish", () => res.off("close", onClose));
    try {
      const result = await generateReply(
        chat,
        body.messages,
        controller.signal,
      );
      result.pipeUIMessageStreamToResponse(res, {
        headers: { "Cache-Control": "no-store" },
        sendReasoning: false,
        onError: () => "Could not generate a reply. Please try again.",
      });
    } catch (error) {
      res.off("close", onClose);
      throw error;
    }
  };
}
