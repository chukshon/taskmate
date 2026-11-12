"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useDeleteBotMutation } from "@/services/bots/mutations"

export function DeleteBotDialog({
  bot,
  disabled,
  onBusyChange,
  onDeleted,
}: {
  bot: { id: string; name: string }
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const mutation = useDeleteBotMutation()

  async function confirmDelete() {
    if (mutation.isPending) return
    onBusyChange(true)
    try {
      await mutation.mutateAsync(bot.id)
      toast.add({ type: "success", title: `${bot.name} deleted` })
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast.add({
        type: "error",
        title: "Could not delete the bot",
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            className="sm:mr-auto"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Delete bot
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes this bot and its direct chat. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => void confirmDelete()}
          >
            {mutation.isPending && <Spinner data-icon="inline-start" />}
            Delete bot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
