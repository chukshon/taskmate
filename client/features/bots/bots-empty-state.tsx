"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { BotDialog } from "@/components/dialog/bot-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { usePaywall } from "@/hooks/use-paywall"

export function BotsEmptyState({ avatarSeed }: { avatarSeed: string }) {
  const [open, setOpen] = useState(false)
  const { checkPlan, checkUsage } = usePaywall()

  return (
    <Empty>
      <EmptyHeader className="max-w-md">
        <EmptyMedia>
          <ChatAvatar seed={avatarSeed} className="size-10" />
        </EmptyMedia>
        <EmptyTitle>Meet your first bot and task mate</EmptyTitle>
        <EmptyDescription>
          Every bot gets its own personality, memory, and face. Spin one up and
          start the conversation.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="secondary"
          size="lg"
          onClick={async () => {
            if (checkPlan("bots") && (await checkUsage("sandbox"))) {
              setOpen(true)
            }
          }}
        >
          <PlusIcon data-icon="inline-start" />
          Create a new bot
        </Button>
        <BotDialog open={open} onOpenChange={setOpen} />
      </EmptyContent>
    </Empty>
  )
}
