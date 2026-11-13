"use client"

import { useState } from "react"
import { PlusIcon, UsersIcon } from "lucide-react"

import { BotDialog } from "@/components/dialog/bot-dialog"
import { ChatSearchDialog } from "@/components/dialog/chat-search-dialog"
import { GroupChatDialog } from "@/components/dialog/group-chat-dialog"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { ChatSearchButton, SidebarChats } from "@/features/chats"
import { usePaywall } from "@/hooks/use-paywall"
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
  const { checkPlan, checkUsage } = usePaywall()

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
                  <DropdownMenuItem
                    onClick={async () => {
                      // A new bot's sandbox starts running right away
                      if (checkPlan("bots") && (await checkUsage("sandbox"))) {
                        setBotDialogOpen(true)
                      }
                    }}
                  >
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
                <UserMenu />
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
