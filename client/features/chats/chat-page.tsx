"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatHeader } from "@/features/chats/chat-header"
import { ChatConversation } from "@/features/chats/chat-conversation"
import { ApiError } from "@/lib/api-error"
import { useChatQuery } from "@/services/chats/queries"

export function ChatFeature({ chatId }: { chatId: string }) {
  const { data, isPending, error, refetch, isFetching } = useChatQuery(chatId)

  if (isPending)
    return (
      <div
        role="status"
        aria-label="Loading chat"
        className="flex h-12 items-center gap-2 border-b px-4"
      >
        <Skeleton className="size-6" />
        <Skeleton className="h-4 w-24" />
      </div>
    )

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle>
            {notFound ? "Chat not found" : "Unable to load chat"}
          </AlertTitle>
          <AlertDescription>
            <p>{error?.message ?? "Please try again."}</p>
            {!notFound && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatHeader chat={data} />
      <ChatConversation
        key={chatId}
        chatId={chatId}
        kind={data.kind}
        bots={data.bots.map(({ id, name, avatar }) => ({
          id,
          name,
          avatar,
        }))}
        title={data.name ?? data.bots[0].name}
      />
    </div>
  )
}
