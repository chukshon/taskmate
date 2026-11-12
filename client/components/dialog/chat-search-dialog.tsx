"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { ChatAvatar } from "@/components/chat-avatar"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"
import { useChatsQuery } from "@/services/chats/queries"

export function ChatSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { data, isPending, error, refetch, isFetching } = useChatsQuery(open)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.shiftKey
      )
        return
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
        return
      if (
        !open &&
        event.target instanceof HTMLElement &&
        event.target.closest('[role="dialog"], [role="alertdialog"]')
      )
        return
      event.preventDefault()
      onOpenChange(!open)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search chats"
      description="Find a conversation by its name or bot."
    >
      {open && (
        <Command>
          <CommandInput
            placeholder="Search chats..."
            aria-label="Search chats"
          />
          <CommandList>
            {error && !data ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <p role="alert" className="text-sm text-muted-foreground">
                  {error.message}
                </p>
                <Button
                  type="button"
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
            ) : (
              <>
                <CommandEmpty>
                  {isPending ? (
                    <span
                      role="status"
                      className="inline-flex items-center gap-2"
                    >
                      <Spinner />
                      Loading chats...
                    </span>
                  ) : (
                    "No chats found."
                  )}
                </CommandEmpty>
                <CommandGroup heading="Chats">
                  {data?.map((chat) => (
                    <CommandItem
                      key={chat.id}
                      value={chat.id}
                      keywords={[
                        chat.name ?? "",
                        ...chat.bots.map((bot) => bot.name),
                      ]}
                      onSelect={() => {
                        onOpenChange(false)
                        router.push(`/chats/${encodeURIComponent(chat.id)}`)
                      }}
                    >
                      {chat.kind === "group" ? (
                        <GroupChatAvatar
                          seeds={chat.bots.map((bot) => bot.avatar)}
                          className="size-6"
                        />
                      ) : (
                        <ChatAvatar seed={chat.bots[0].avatar} />
                      )}
                      <span className="truncate">
                        {chat.name ?? chat.bots[0].name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      )}
    </CommandDialog>
  )
}
