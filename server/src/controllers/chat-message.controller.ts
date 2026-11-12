import type { Request, RequestHandler } from "express";
import { z } from "zod";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";
import { getChatRequest } from "@/controllers/chat.controller";
import { getChat } from "@/services/chat.service";
import { streamChatReply } from "@/services/chat-message.service";

export const sendChatMessageRequest = {
  params: getChatRequest.params,
  body: z
    .object({
      messages: z
        .array(
          z.object({
            id: z.string().min(1).max(128),
            role: z.enum(["user", "assistant"]),
            parts: z
              .array(
                z.object({
                  type: z.literal("text"),
                  text: z.string().max(8000),
                }),
              )
              .min(1)
              .max(20),
          }),
        )
        .min(1)
        .max(100),
    })
    .refine(
      ({ messages }) => {
        const last = messages.at(-1);
        return (
          last?.role === "user" &&
          last.parts.some(({ text }) => text.trim().length > 0)
        );
      },
      { message: "Send a non-empty user message.", path: ["messages"] },
    ),
};

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
