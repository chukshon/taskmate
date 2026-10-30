"use client"

import { UserButton } from "@clerk/nextjs"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
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
  )
}
