import { z } from "zod";
import { botInsertSchema, botFormSchema } from "@/db/schema";

export const createBotRequest = { body: botInsertSchema };
export const updateBotRequest = {
  params: z.object({ botId: z.string().min(1).max(128) }),
  body: botFormSchema,
};
export const deleteBotRequest = { params: updateBotRequest.params };

