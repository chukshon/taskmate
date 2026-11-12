"use client"

import { format, formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { ChatSummary } from "@/services/chats/types"

export function SidebarChatItem({ chat }: { chat: ChatSummary }) {
  const pathname = usePathname()
  const href = `/chats/${encodeURIComponent(chat.id)}`
  const isActive = pathname === href
  const title = chat.name ?? chat.bots[0]?.name ?? "Chat"
  const date = new Date(chat.lastMessageAt)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={href}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
          />
        }
        size="lg"
        isActive={isActive}
        aria-label={title}
        tooltip={title}
        className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
      >
        {chat.kind === "group" ? (
          <GroupChatAvatar
            seeds={chat.bots.map((bot) => bot.avatar)}
            className="group-data-[collapsible=icon]:size-6"
          />
        ) : (
          <ChatAvatar
            seed={chat.bots[0].avatar}
            className="group-data-[collapsible=icon]:size-6"
          />
        )}
        <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-medium">{title}</span>
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
