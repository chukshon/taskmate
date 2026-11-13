"use client"

import { UserButton } from "@clerk/nextjs"
import { GaugeIcon } from "lucide-react"

// The account button in the sidebar footer, with the usage page in its menu.
// A client component, as the menu's parts only exist on the client.
function UserMenu() {
  return (
    // Clerk's own styles beat plain utilities, so the SidebarMenuButton classes are mirrored here as important.
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
    >
      <UserButton.MenuItems>
        <UserButton.Action label="manageAccount" />
        <UserButton.Link
          label="Usage"
          labelIcon={<GaugeIcon className="size-4" />}
          href="/usage"
        />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  )
}

export { UserMenu }
