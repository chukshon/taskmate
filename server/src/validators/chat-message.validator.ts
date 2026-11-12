import { z } from "zod";
import { getChatRequest } from "@/validators/chat.validator";

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

