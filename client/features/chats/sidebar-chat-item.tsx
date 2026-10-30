import { format, formatDistanceToNowStrict } from "date-fns"

import { ChatAvatar } from "@/components/chat-avatar"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { ChatSummary } from "@/services/chats/types"

export function SidebarChatItem({ chat }: { chat: ChatSummary }) {
  const bot = chat.bots[0]
  const date = new Date(chat.lastMessageAt)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<div />} size="lg">
        <ChatAvatar seed={bot.avatar} />
        <div className="grid min-w-0 flex-1 text-left leading-tight">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-medium">
              {chat.name ?? bot.name}
            </span>
            <time
              dateTime={chat.lastMessageAt}
              title={format(date, "PPpp")}
              className="ml-auto shrink-0 text-xs text-muted-foreground"
            >
              {formatDistanceToNowStrict(date)}
            </time>
          </div>
          {chat.lastMessagePreview && (
            <span className="truncate text-xs text-muted-foreground">
              {chat.lastMessagePreview}
            </span>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
