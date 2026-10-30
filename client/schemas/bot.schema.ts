import { z } from "zod"

export const botFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your bot a name.")
    .max(50, "Keep it under 50 characters."),
  avatar: z
    .string()
    .trim()
    .min(1, "Choose a face.")
    .max(100, "Keep the face seed under 100 characters."),
  job: z
    .string()
    .trim()
    .min(1, "Tell your bot what its job is.")
    .max(100, "Keep it under 100 characters."),
  instructions: z.string().trim().max(4000, "Keep it under 4000 characters."),
})

export type BotFormValues = z.infer<typeof botFormSchema>
