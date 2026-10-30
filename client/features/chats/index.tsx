import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar"
import { SidebarChatList } from "@/features/chats/sidebar-chat-list"

export function SidebarChats() {
  return (
    <SidebarGroup aria-label="Chats">
      <SidebarGroupContent>
        <SidebarChatList />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
