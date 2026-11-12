"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { useApiAuth } from "@/hooks/use-api-auth"
import { ApiError } from "@/lib/api-error"
import type { GroupChatInsert } from "@/schemas/group-chat.schema"
import { chatKeys } from "@/services/chats/keys"
import {
  createGroupChat,
  deleteGroupChat,
  updateGroupChat,
} from "@/services/chats/requests"

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

export function useUpdateGroupChatMutation() {
  const queryClient = useQueryClient()
  const { getAccessToken, userId } = useApiAuth()

  return useMutation({
    mutationKey: ["chats", userId, "update-group"],
    mutationFn: async ({
      chatId,
      values,
    }: {
      chatId: string
      values: GroupChatInsert
    }) => {
      if (!userId)
        throw new ApiError("Please sign in to update a group chat.", 401)
      return updateGroupChat(chatId, values, await getAccessToken())
    },
    onSuccess: async (chat) => {
      if (!userId) return
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(userId, chat.id),
        }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.list(userId),
        }),
      ])
    },
  })
}

export function useDeleteGroupChatMutation() {
  const queryClient = useQueryClient()
  const { getAccessToken, userId } = useApiAuth()

  return useMutation({
    mutationKey: ["chats", userId, "delete-group"],
    retry: false,
    mutationFn: async (chatId: string) => {
      if (!userId)
        throw new ApiError("Please sign in to delete a group chat.", 401)
      return deleteGroupChat(chatId, await getAccessToken())
    },
    onSuccess: async (chat) => {
      if (!userId) return
      queryClient.removeQueries({
        queryKey: chatKeys.detail(userId, chat.id),
        exact: true,
      })
      await queryClient.invalidateQueries({
        queryKey: chatKeys.list(userId),
      })
    },
  })
}
