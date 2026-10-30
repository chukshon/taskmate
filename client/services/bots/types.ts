import type { BotFormValues } from "@/schemas/bot.schema"

export type CreateBotRequest = BotFormValues

export type Bot = Omit<BotFormValues, "instructions"> & {
  id: string
  userId: string
  instructions: string | null
  sandboxId: string | null
  createdAt: string
}
