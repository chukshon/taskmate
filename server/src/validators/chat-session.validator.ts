import { z } from "zod";
import { aiProviderIds, defaultAIProvider } from "@/config/ai.config";
import { getChatRequest } from "@/validators/chat.validator";

const clientDataSchema = z
  .object({
    provider: z.enum(aiProviderIds).default(defaultAIProvider),
    model: z.string().min(1).max(128).default("auto"),
  })
  .optional();

export const startChatSessionRequest = {
  params: getChatRequest.params,
  body: z.object({
    clientData: clientDataSchema,
  }),
};

export const mintChatAccessTokenRequest = {
  params: getChatRequest.params,
};

export const loadChatTranscriptRequest = {
  params: getChatRequest.params,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    before: z.string().trim().min(1).max(128).optional(),
  }),
};
