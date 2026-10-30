"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useApiAuth } from "@/hooks/use-api-auth"
import { ApiError } from "@/lib/api-error"
import { botKeys } from "@/services/bots/keys"
import { createBot, updateBot, deleteBot } from "@/services/bots/requests"
import type { CreateBotRequest } from "@/services/bots/types"
import { chatKeys } from "@/services/chats/keys"

export function useDeleteBotMutation() {
  const queryClient = useQueryClient()
  const { getAccessToken, userId } = useApiAuth()
  return useMutation({
    mutationKey: ["bots", userId, "delete"],
    retry: false,
    mutationFn: async (botId: string) => {
      if (!userId) throw new ApiError("Please sign in to delete a bot.", 401)
      return deleteBot(botId, await getAccessToken())
    },
    onSuccess: async (result) => {
      if (!userId) return
      queryClient.removeQueries({
        queryKey: botKeys.detail(userId, result.id),
        exact: true,
      })
      await queryClient.invalidateQueries({
        queryKey: chatKeys.all(userId),
        refetchType: "none",
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: botKeys.lists(userId) }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.list(userId),
          exact: true,
        }),
      ])
    },
  })
}

export function useUpdateBotMutation() {
  const queryClient = useQueryClient()
  const { getAccessToken, userId } = useApiAuth()
  return useMutation({
    mutationKey: ["bots", userId, "update"],
    mutationFn: async ({
      botId,
      values,
    }: {
      botId: string
      values: CreateBotRequest
    }) => {
      if (!userId) throw new ApiError("Please sign in to update a bot.", 401)
      return updateBot(botId, values, await getAccessToken())
    },
    onSuccess: async (bot) => {
      if (!userId) return
      queryClient.setQueryData(botKeys.detail(userId, bot.id), bot)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: botKeys.lists(userId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) }),
      ])
    },
  })
}

export function useCreateBotMutation() {
  const queryClient = useQueryClient()
  const { getAccessToken, userId } = useApiAuth()

  return useMutation({
    mutationKey: ["bots", userId, "create"],
    mutationFn: async (values: CreateBotRequest) => {
      if (!userId) throw new ApiError("Please sign in to create a bot.", 401)
      return createBot(values, await getAccessToken())
    },
    onSuccess: async (bot) => {
      if (!userId) return
      queryClient.setQueryData(botKeys.detail(userId, bot.id), bot)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: botKeys.lists(userId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.list(userId) }),
      ])
    },
  })
}
