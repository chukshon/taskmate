"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { useApiAuth } from "@/hooks/use-api-auth"
import { ApiError } from "@/lib/api-error"
import type { GroupChatInsert } from "@/schemas/group-chat.schema"
import { chatKeys } from "@/services/chats/keys"
import { createGroupChat } from "@/services/chats/requests"

export function useCreateGroupChatMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { getAccessToken, userId } = useApiAuth()

  return useMutation({
    mutationKey: ["chats", userId, "create-group"],
    retry: false,
    mutationFn: async (values: GroupChatInsert) => {
      if (!userId)
        throw new ApiError("Please sign in to create a group chat.", 401)
      return createGroupChat(values, await getAccessToken())
    },
    onSuccess: async (chat) => {
      if (!userId) return
      await queryClient.invalidateQueries({
        queryKey: chatKeys.list(userId),
      })
      router.push(`/chats/${encodeURIComponent(chat.id)}`)
    },
  })
}
