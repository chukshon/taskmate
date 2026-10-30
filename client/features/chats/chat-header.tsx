import { MonitorIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import { BotDialog } from "@/components/dialog/bot-dialog"
import type { ChatDetail } from "@/services/chats/types"

export function ChatHeader({ chat }: { chat: ChatDetail }) {
  const bot = chat.bots[0]

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
      <BotDialog
        bot={{ ...bot, instructions: bot.instructions ?? "" }}
        trigger={
          <Button
            type="button"
            variant="ghost"
            aria-label={`Edit ${bot.name}`}
            className="min-w-0 justify-start"
          />
        }
      >
        <ChatAvatar seed={bot.avatar} className="size-6" />
        <span className="truncate text-sm font-semibold">{bot.name}</span>
      </BotDialog>
      <Button type="button" variant="ghost" size="icon" aria-label="Desktop">
        <MonitorIcon />
      </Button>
    </header>
  )
}
