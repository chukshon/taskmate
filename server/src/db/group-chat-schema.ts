import { z } from "zod";

// Browser-safe insert contract for group chats (name + member bot IDs).
export const groupChatInsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the group a name.")
    .max(50, "Keep it under 50 characters."),
  botIds: z.array(z.string()).min(2, "Pick at least two bots."),
});

export type GroupChatInsert = z.infer<typeof groupChatInsertSchema>;
