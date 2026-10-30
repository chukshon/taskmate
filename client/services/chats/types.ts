import type { z } from "zod"
import type { chatListSchema } from "@/schemas/chat.schema"

export type ChatSummary = z.infer<typeof chatListSchema>[number]
