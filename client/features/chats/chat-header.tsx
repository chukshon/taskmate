import { MonitorIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import type { ChatSummary } from "@/services/chats/types"

export function ChatHeader({ chat }: { chat: ChatSummary }) {
  const bot = chat.bots[0]

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ChatAvatar seed={bot.avatar} className="size-6" />
        <h1 className="truncate text-sm font-semibold">{bot.name}</h1>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label="Desktop">
        <MonitorIcon />
      </Button>
    </header>
  )
}
