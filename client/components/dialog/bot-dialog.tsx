"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BotForm, type EditableBot } from "@/features/bots/bot-form"

function BotDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  bot,
  trigger,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  bot?: EditableBot
  trigger?: React.ReactElement
}) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [busy, setBusy] = useState(false)

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
          <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
          <DialogDescription>
            {bot
              ? "Update its face, name, and how it should work."
              : "Give it a face, a name, and a job to do."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <BotForm
            bot={bot}
            onBusyChange={setBusy}
            onSaved={() => {
              setOpen(false)
              router.refresh()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export { BotDialog }
