import { z } from "zod";

export const getChatRequest = { params: z.object({ chatId: z.string().trim().min(1).max(128) }) };

