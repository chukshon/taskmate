"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { GroupChatForm } from "@/features/chats/group-chat-form"
import { useBotsQuery } from "@/services/bots/queries"

function GroupChatDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [busy, setBusy] = useState(false)
  const { data: bots, isPending, error, refetch, isFetching } = useBotsQuery(
    open
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) setOpen(nextOpen)
      }}
    >
      {(children || trigger) && (
        <DialogTrigger
          render={trigger ?? <Button variant="secondary" size="lg" />}
        >
          {children}
        </DialogTrigger>
      )}
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md"
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle>New group chat</DialogTitle>
          <DialogDescription>
            Name the group and pick which bots are in it.
          </DialogDescription>
        </DialogHeader>
        {open &&
          (isPending ? (
            <div
              role="status"
              aria-label="Loading bots"
              className="flex justify-center py-8"
            >
              <Spinner />
            </div>
          ) : error || !bots ? (
            <div className="flex flex-col items-start gap-3 py-2">
              <p className="text-sm text-muted-foreground">
                {error?.message ?? "Could not load bots."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <GroupChatForm
              bots={bots.map(({ id, name, avatar }) => ({
                id,
                name,
                avatar,
              }))}
              onBusyChange={setBusy}
              onSaved={() => setOpen(false)}
            />
          ))}
      </DialogContent>
    </Dialog>
  )
}

export { GroupChatDialog }
