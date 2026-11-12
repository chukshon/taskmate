"use client"

import { UserButton } from "@clerk/nextjs"
import { useState } from "react"
import { PlusIcon, UsersIcon } from "lucide-react"

import { BotDialog } from "@/components/dialog/bot-dialog"
import { ChatSearchDialog } from "@/components/dialog/chat-search-dialog"
import { GroupChatDialog } from "@/components/dialog/group-chat-dialog"
import { Button } from "@/components/ui/button"
import { ChatSearchButton, SidebarChats } from "@/features/chats"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Create"
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  />
                }
              >
                <PlusIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
                    <PlusIcon />
                    Create new bot
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
                    <UsersIcon />
                    Create group chat
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ChatSearchButton
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
          />
        </SidebarHeader>
        <SidebarContent className="group-data-[collapsible=icon]:overflow-auto">
          <SidebarChats />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<div />}
                className="p-0 group-data-[collapsible=icon]:p-0!"
              >
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      rootBox: "flex! min-w-0! w-full!",
                      userButtonTrigger:
                        "h-8! w-full! justify-start! rounded-md! px-2! py-1! text-sidebar-foreground! shadow-none! ring-sidebar-ring! hover:bg-sidebar-accent! hover:text-sidebar-accent-foreground! focus-visible:ring-2! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-1!",
                      userButtonBox: "min-w-0! w-full! gap-2!",
                      userButtonAvatarBox: "order-first! size-6! shrink-0!",
                      userButtonOuterIdentifier:
                        "min-w-0! truncate! p-0! text-left! text-sm! font-normal! text-inherit! group-data-[collapsible=icon]:hidden!",
                    },
                  }}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
      <GroupChatDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
      />
      <ChatSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
