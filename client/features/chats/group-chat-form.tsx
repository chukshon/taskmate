"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { ChatAvatar } from "@/components/chat-avatar"
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
import { useCreateGroupChatMutation } from "@/services/chats/mutations"

type GroupChatBot = {
  id: string
  name: string
  avatar: string
}

export function GroupChatForm({
  bots,
  onSaved,
  onBusyChange,
}: {
  bots: GroupChatBot[]
  onSaved: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const createGroupChatMutation = useCreateGroupChatMutation()
  const form = useForm<GroupChatInsert>({
    resolver: zodResolver(groupChatInsertSchema),
    defaultValues: {
      name: "",
      botIds: [],
    },
  })
  const isSubmitting =
    form.formState.isSubmitting || createGroupChatMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    onBusyChange(true)
    form.clearErrors("root")
    try {
      const created = await createGroupChatMutation.mutateAsync(values)
      toast.add({
        type: "success",
        title: `${created.name ?? "Group"} is ready`,
      })
      onSaved()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Try again."
      form.setError("root", { message })
      toast.add({
        type: "error",
        title: "Couldn't create the group chat",
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
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Create group
        </Button>
      </DialogFooter>
    </form>
  )
}
