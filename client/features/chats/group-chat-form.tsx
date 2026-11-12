"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2Icon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { ChatAvatar } from "@/components/chat-avatar"
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
import { Checkbox } from "@/components/ui/checkbox"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api-error"
import {
  groupChatInsertSchema,
  type GroupChatInsert,
} from "@/schemas/group-chat.schema"
import {
  useCreateGroupChatMutation,
  useDeleteGroupChatMutation,
  useUpdateGroupChatMutation,
} from "@/services/chats/mutations"

type GroupChatBot = {
  id: string
  name: string
  avatar: string
}

type EditableGroupChat = {
  id: string
  name: string | null
  bots: { id: string }[]
}

function GroupChatDeleteButton({
  chat,
  disabled,
  onBusyChange,
  onDeleted,
}: {
  chat: EditableGroupChat
  disabled: boolean
  onBusyChange: (busy: boolean) => void
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const deleteGroupChatMutation = useDeleteGroupChatMutation()
  const title = chat.name ?? "this group"

  async function confirmDelete() {
    if (deleteGroupChatMutation.isPending) return
    onBusyChange(true)
    try {
      await deleteGroupChatMutation.mutateAsync(chat.id)
      toast.add({ type: "success", title: `${title} is deleted` })
      setOpen(false)
      onDeleted()
    } catch (error) {
      toast.add({
        type: "error",
        title: "Couldn't delete the group chat",
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
        if (!deleteGroupChatMutation.isPending) setOpen(nextOpen)
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
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the group chat and its messages. The bots in it stay.
            It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteGroupChatMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={deleteGroupChatMutation.isPending}
            onClick={() => void confirmDelete()}
          >
            {deleteGroupChatMutation.isPending && (
              <Spinner data-icon="inline-start" />
            )}
            Delete group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function GroupChatForm({
  chat,
  bots,
  onSaved,
  onBusyChange,
  onDeleted,
}: {
  chat?: EditableGroupChat
  bots: GroupChatBot[]
  onSaved: () => void
  onBusyChange: (busy: boolean) => void
  onDeleted?: () => void
}) {
  const createGroupChatMutation = useCreateGroupChatMutation()
  const updateGroupChatMutation = useUpdateGroupChatMutation()
  const form = useForm<GroupChatInsert>({
    resolver: zodResolver(groupChatInsertSchema),
    defaultValues: {
      name: chat?.name ?? "",
      botIds: chat?.bots.map((bot) => bot.id) ?? [],
    },
  })
  const isSubmitting =
    form.formState.isSubmitting ||
    createGroupChatMutation.isPending ||
    updateGroupChatMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    onBusyChange(true)
    form.clearErrors("root")
    try {
      if (chat) {
        const updated = await updateGroupChatMutation.mutateAsync({
          chatId: chat.id,
          values,
        })
        toast.add({
          type: "success",
          title: `${updated.name ?? "Group"} is updated`,
        })
      } else {
        const created = await createGroupChatMutation.mutateAsync(values)
        toast.add({
          type: "success",
          title: `${created.name ?? "Group"} is ready`,
        })
      }
      onSaved()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Try again."
      form.setError("root", { message })
      toast.add({
        type: "error",
        title: chat
          ? "Couldn't update the group chat"
          : "Couldn't create the group chat",
        description: message,
      })
    } finally {
      onBusyChange(false)
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="group-chat-name">Name</FieldLabel>
              <Input
                {...field}
                id="group-chat-name"
                placeholder="Weekend plans"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="botIds"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">Bots</FieldLegend>
              {bots.length < 2 && (
                <FieldDescription>
                  A group needs at least two bots. Create more bots first.
                </FieldDescription>
              )}
              <FieldGroup data-slot="checkbox-group">
                {bots.map((bot) => (
                  <Field
                    key={bot.id}
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id={`group-chat-bot-${bot.id}`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value.includes(bot.id)}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, bot.id]
                            : field.value.filter((id) => id !== bot.id)
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`group-chat-bot-${bot.id}`}
                      className="min-w-0 items-center font-normal"
                    >
                      <ChatAvatar seed={bot.avatar} className="size-6" />
                      <span className="truncate">{bot.name}</span>
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
        {form.formState.errors.root && (
          <FieldError errors={[form.formState.errors.root]} />
        )}
      </FieldGroup>
      <DialogFooter>
        {chat && onDeleted && (
          <GroupChatDeleteButton
            chat={chat}
            disabled={isSubmitting}
            onBusyChange={onBusyChange}
            onDeleted={onDeleted}
          />
        )}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {chat ? "Save changes" : "Create group"}
        </Button>
      </DialogFooter>
    </form>
  )
}
