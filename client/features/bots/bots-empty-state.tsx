import { PlusIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { BotDialog } from "@/components/dialog/bot-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function BotsEmptyState({ avatarSeed }: { avatarSeed: string }) {
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
        <BotDialog>
          <PlusIcon data-icon="inline-start" />
          Create a new bot
        </BotDialog>
      </EmptyContent>
    </Empty>
  )
}
