import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { inputClassName } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export function ChatSearchButton({
  open,
  onOpen,
}: {
  open: boolean
  onOpen: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        inputClassName,
        "justify-start font-normal text-muted-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:hover:bg-sidebar-accent"
      )}
      aria-label="Search chats"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onOpen}
    >
      <SearchIcon data-icon="inline-start" />
      <span className="group-data-[collapsible=icon]:hidden">Search</span>
      <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">⌘K</Kbd>
    </Button>
  )
}
