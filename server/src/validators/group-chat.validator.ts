import { groupChatInsertSchema } from "@/db/group-chat-schema";
import { getChatRequest } from "@/validators/chat.validator";

export const createGroupChatRequest = { body: groupChatInsertSchema };

export const updateGroupChatRequest = {
  params: getChatRequest.params,
  body: groupChatInsertSchema,
};

export const deleteGroupChatRequest = {
  params: getChatRequest.params,
};
