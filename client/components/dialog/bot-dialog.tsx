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
import { BotForm } from "@/features/bots/bot-form"

function BotDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
      {children && (
        <DialogTrigger render={<Button variant="secondary" size="lg" />}>
          {children}
        </DialogTrigger>
      )}
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md"
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>
            Give it a face, a name, and a job to do.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <BotForm
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
