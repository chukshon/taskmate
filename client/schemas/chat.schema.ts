import { z } from "zod"

export const chatSchema = z.object({
  id: z.string(),
  kind: z.enum(["direct", "group"]),
  name: z.string().nullable(),
  lastMessagePreview: z.string().nullable(),
  lastMessageAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  bots: z
    .array(z.object({ id: z.string(), name: z.string(), avatar: z.string() }))
    .min(1),
})

export const chatListSchema = z.array(chatSchema)

export const chatDetailSchema = chatSchema.extend({
  bots: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string(),
        job: z.string(),
        instructions: z.string().nullable(),
      })
    )
    .min(1),
})
