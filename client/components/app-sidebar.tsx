"use client"

import { UserButton } from "@clerk/nextjs"
import { useState } from "react"
import { PlusIcon, UsersIcon } from "lucide-react"

import { BotDialog } from "@/components/dialog/bot-dialog"
import { Button } from "@/components/ui/button"
import { SidebarChats } from "@/features/chats"
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
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const [botDialogOpen, setBotDialogOpen] = useState(false)

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="secondary" size="icon" aria-label="Create" />
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
                  <DropdownMenuItem>
                    <UsersIcon />
                    Create group chat
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarChats />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<div />} className="p-0">
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      rootBox: "flex! min-w-0! w-full!",
                      userButtonTrigger:
                        "h-8! w-full! justify-start! rounded-md! px-2! py-1! text-sidebar-foreground! shadow-none! ring-sidebar-ring! hover:bg-sidebar-accent! hover:text-sidebar-accent-foreground! focus-visible:ring-2!",
                      userButtonBox: "min-w-0! w-full! gap-2!",
                      userButtonAvatarBox: "order-first! size-6! shrink-0!",
                      userButtonOuterIdentifier:
                        "min-w-0! truncate! p-0! text-left! text-sm! font-normal! text-inherit!",
                    },
                  }}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <BotDialog open={botDialogOpen} onOpenChange={setBotDialogOpen} />
    </>
  )
}
