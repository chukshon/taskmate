"use client"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarChatItem } from "@/features/chats/sidebar-chat-item"
import { useChatsQuery } from "@/services/chats/queries"

export function SidebarChatList() {
  const { data, isPending, error, refetch, isFetching } = useChatsQuery()

  if (isPending)
    return (
      <SidebarMenu aria-label="Loading chats">
        {[0, 1, 2].map((key) => (
          <SidebarMenuItem key={key}>
            <SidebarMenuButton
              render={<div />}
              size="lg"
              className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
            >
              <Skeleton className="size-8 shrink-0 group-data-[collapsible=icon]:size-6" />
              <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )

  if (error && !data)
    return (
      <div className="flex flex-col gap-2 p-2">
        <p role="alert" className="text-sm text-muted-foreground">
          {error.message}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          Retry
        </Button>
      </div>
    )

  if (!data?.length)
    return (
      <Empty className="p-2 group-data-[collapsible=icon]:hidden">
        <EmptyDescription>No chats yet.</EmptyDescription>
      </Empty>
    )

  return (
    <SidebarMenu aria-label="Chats">
      {data.map((chat) => (
        <SidebarChatItem key={chat.id} chat={chat} />
      ))}
    </SidebarMenu>
  )
}
