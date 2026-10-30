import type { z } from "zod"
import type { chatListSchema, chatDetailSchema } from "@/schemas/chat.schema"

export type ChatSummary = z.infer<typeof chatListSchema>[number]
export type ChatDetail = z.infer<typeof chatDetailSchema>
