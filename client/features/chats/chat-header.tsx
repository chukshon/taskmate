import { MonitorIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { useDesktopPanel } from "@/components/desktop-panel"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Button } from "@/components/ui/button"
import { BotDialog } from "@/components/dialog/bot-dialog"
import { GroupChatDialog } from "@/components/dialog/group-chat-dialog"
import type { ChatDetail } from "@/services/chats/types"

function DesktopButton() {
  const desktopPanel = useDesktopPanel()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Desktop"
      aria-pressed={desktopPanel.open}
      onClick={desktopPanel.toggle}
    >
      <MonitorIcon />
    </Button>
  )
}

export function ChatHeader({ chat }: { chat: ChatDetail }) {
  const title = chat.name ?? chat.bots[0]?.name ?? "Chat"
  const seeds = chat.bots.map((bot) => bot.avatar)

  if (chat.kind === "group") {
    return (
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <GroupChatDialog
          chat={{
            id: chat.id,
            name: chat.name,
            bots: chat.bots.map(({ id }) => ({ id })),
          }}
          trigger={
            <Button
              type="button"
              variant="ghost"
              aria-label={`Edit ${title}`}
              className="min-w-0 justify-start"
            />
          }
        >
          <GroupChatAvatar seeds={seeds} className="size-6" />
          <span className="truncate text-sm font-semibold">{title}</span>
        </GroupChatDialog>
      </header>
    )
  }

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
      <DesktopButton />
    </header>
  )
}
