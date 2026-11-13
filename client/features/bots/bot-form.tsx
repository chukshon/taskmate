"use client"

import { useId, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShuffleIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { ChatAvatar } from "@/components/chat-avatar"
import { DeleteBotDialog } from "@/components/dialog/delete-bot-dialog"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { botPresets } from "@/constants/bot"
import { usePaywall } from "@/hooks/use-paywall"
import { ApiError } from "@/lib/api-error"
import {
  UPGRADE_REQUIRED_MESSAGE,
  USAGE_LIMIT_REACHED_MESSAGE,
} from "@/lib/billing"
import { botFormSchema, type BotFormValues } from "@/schemas/bot.schema"
import {
  useCreateBotMutation,
  useUpdateBotMutation,
} from "@/services/bots/mutations"

export type EditableBot = BotFormValues & { id: string }

export function BotForm({
  onSaved,
  onBusyChange,
  bot,
  onDeleted,
}: {
  onSaved: () => void
  onBusyChange: (busy: boolean) => void
  bot?: EditableBot
  onDeleted: () => void
}) {
  const createBotMutation = useCreateBotMutation()
  const updateBotMutation = useUpdateBotMutation()
  const { checkPlan, checkUsage, showUpgradeRequired, showUsageLimit } =
    usePaywall()
  const id = useId()
  const [initialSeed] = useState(() => crypto.randomUUID())
  const [isDeleting, setIsDeleting] = useState(false)
  const form = useForm<BotFormValues>({
    resolver: zodResolver(botFormSchema),
    defaultValues: bot
      ? {
          name: bot.name,
          avatar: bot.avatar,
          job: bot.job,
          instructions: bot.instructions,
        }
      : { name: "", avatar: initialSeed, job: "", instructions: "" },
  })
  const { errors } = form.formState
  const isSubmitting =
    isDeleting ||
    form.formState.isSubmitting ||
    createBotMutation.isPending ||
    updateBotMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    if (!bot) {
      if (
        !checkPlan("bots") ||
        !checkPlan("sandboxes") ||
        !(await checkUsage("sandbox"))
      ) {
        return
      }
    }
    onBusyChange(true)
    form.clearErrors("root")
    try {
      const saved = bot
        ? await updateBotMutation.mutateAsync({ botId: bot.id, values })
        : await createBotMutation.mutateAsync(values)
      toast.add({
        type: "success",
        title: bot ? `${saved.name} updated` : `${saved.name} is ready`,
      })
      onSaved()
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.message === UPGRADE_REQUIRED_MESSAGE
      ) {
        showUpgradeRequired()
        return
      }
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.message === USAGE_LIMIT_REACHED_MESSAGE
      ) {
        showUsageLimit("sandbox")
        return
      }
      if (error instanceof ApiError) {
        for (const issue of error.errors) {
          const field = issue.field.replace(/^body\./, "")
          if (
            field === "name" ||
            field === "avatar" ||
            field === "job" ||
            field === "instructions"
          ) {
            form.setError(field, { message: issue.message })
          }
        }
      }
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Could not save the bot. Try again.",
      })
      toast.add({
        type: "error",
        title: "Could not save the bot",
        description:
          error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      onBusyChange(false)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {botPresets.map((preset) => (
          <Button
            key={preset.job}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={isSubmitting}
            onClick={() => {
              form.setValue("job", preset.job, {
                shouldDirty: true,
                shouldValidate: true,
              })
              form.setValue("instructions", preset.instructions, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
          >
            {preset.job}
          </Button>
        ))}
      </div>
      <FieldGroup>
        <Controller
          name="avatar"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Field orientation="horizontal">
                <ChatAvatar seed={field.value} className="size-10" />
                <FieldContent>
                  <FieldTitle>Face</FieldTitle>
                  <FieldDescription>
                    Shuffle until you find one you like.
                  </FieldDescription>
                </FieldContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => field.onChange(crypto.randomUUID())}
                >
                  <ShuffleIcon data-icon="inline-start" />
                  Shuffle
                </Button>
              </Field>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                {...field}
                id={`${id}-name`}
                placeholder="Ada"
                autoComplete="off"
                maxLength={50}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? `${id}-name-error` : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id={`${id}-name-error`}
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="job"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-job`}>Job</FieldLabel>
              <Input
                {...field}
                id={`${id}-job`}
                placeholder="Research assistant"
                autoComplete="off"
                maxLength={100}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? `${id}-job-error` : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id={`${id}-job-error`}
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
        <Controller
          name="instructions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-instructions`}>
                How it should work
              </FieldLabel>
              <Textarea
                {...field}
                id={`${id}-instructions`}
                className="min-h-24"
                maxLength={4000}
                placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? `${id}-instructions-error` : undefined
                }
              />
              {fieldState.invalid && (
                <FieldError
                  id={`${id}-instructions-error`}
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </FieldGroup>
      {errors.root && (
        <FieldError role="alert">{errors.root.message}</FieldError>
      )}
      <DialogFooter>
        {bot && (
          <DeleteBotDialog
            bot={bot}
            disabled={isSubmitting}
            onBusyChange={(busy) => {
              setIsDeleting(busy)
              onBusyChange(busy)
            }}
            onDeleted={onDeleted}
          />
        )}
        <DialogClose
          render={
            <Button type="button" variant="outline" disabled={isSubmitting} />
          }
        >
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {bot ? "Save changes" : "Create bot"}
        </Button>
      </DialogFooter>
    </form>
  )
}
