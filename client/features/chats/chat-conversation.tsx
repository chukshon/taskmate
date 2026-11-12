"use client"

import { useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { useLoadTranscript } from "@trigger.dev/sdk/chat/react"
import type { TriggerChatTransport } from "@trigger.dev/sdk/chat"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatModelSelector } from "@/features/chats/chat-model-selector"
import type { ChatModelSelection } from "@/schemas/ai.schema"
import { useChatModelsQuery } from "@/services/chats/queries"
import { useApiAuth } from "@/hooks/use-api-auth"
import {
  loadChatTranscript,
  useChatTransport,
  type ChatUIMessage,
} from "@/services/chats/transport"

export function ChatConversation({
  chatId,
  botName,
}: {
  chatId: string
  botName: string
}) {
  const { getAccessToken } = useApiAuth()
  const {
    data: catalog,
    error: catalogError,
    refetch: reloadCatalog,
  } = useChatModelsQuery()
  const [selection, setSelection] = useState<ChatModelSelection | null>(null)
  const activeSelection = selection ?? {
    provider: catalog?.defaultProvider ?? "google",
    model: "auto",
  }
  const transport = useChatTransport({
    getAccessToken,
    clientData: activeSelection,
  })
  const { messages, isLoading, error: transcriptError } = useLoadTranscript(
    chatId,
    (params) => loadChatTranscript(params, getAccessToken),
    { transport }
  )

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading conversation"
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <Spinner />
      </div>
    )
  }

  if (transcriptError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-start p-4">
        <Alert variant="destructive">
          <AlertDescription>
            {transcriptError.message || "Could not load this conversation."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ChatMessages
      key={chatId}
      chatId={chatId}
      botName={botName}
      catalog={catalog}
      catalogError={catalogError}
      reloadCatalog={reloadCatalog}
      selection={activeSelection}
      onSelectionChange={setSelection}
      initialMessages={messages}
      transport={transport}
    />
  )
}

function ChatMessages({
  chatId,
  botName,
  catalog,
  catalogError,
  reloadCatalog,
  selection,
  onSelectionChange,
  initialMessages,
  transport,
}: {
  chatId: string
  botName: string
  catalog: ReturnType<typeof useChatModelsQuery>["data"]
  catalogError: ReturnType<typeof useChatModelsQuery>["error"]
  reloadCatalog: ReturnType<typeof useChatModelsQuery>["refetch"]
  selection: ChatModelSelection
  onSelectionChange: (selection: ChatModelSelection) => void
  initialMessages: ChatUIMessage[]
  transport: TriggerChatTransport
}) {
  const [input, setInput] = useState("")
  const submittedInput = useRef("")
  const provider = catalog?.providers.find(({ id }) => id === selection.provider)
  const canSend = Boolean(provider?.available)
  const { messages, sendMessage, status, error, regenerate, stop } =
    useChat<ChatUIMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
      resume: initialMessages.length > 0,
      onError: () => setInput(submittedInput.current),
    })
  const busy = status === "submitted" || status === "streaming"

  return (
    <>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 && (
            <ConversationEmptyState
              title={`Chat with ${botName}`}
              description="Send a message to start the conversation."
            />
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <span className="sr-only">
                {message.role === "user" ? "You" : botName}
              </span>
              <MessageContent>
                {message.parts.map((part, index) =>
                  part.type === "text" ? (
                    <MessageResponse key={`${message.id}-${index}`}>
                      {part.text}
                    </MessageResponse>
                  ) : null
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <div role="status" aria-label={`${botName} is thinking`}>
              <Spinner />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-3 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>
                {error.message || "Could not get a reply. Please try again."}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !canSend}
                onClick={() => {
                  setInput("")
                  void regenerate()
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {catalogError && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-2">
              Could not load AI providers.
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void reloadCatalog()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {catalog && !canSend && (
          <p role="status" className="text-sm text-muted-foreground">
            {provider?.name ?? "This provider"} is not configured. Select an
            available provider or add its server API key.
          </p>
        )}
        <PromptInput
          onSubmit={async ({ text }) => {
            if (busy || !canSend || !text.trim()) return
            const submitted = text.trim()
            submittedInput.current = submitted
            setInput("")
            await sendMessage({ text: submitted })
          }}
        >
          <PromptInputTextarea
            aria-label="Message"
            placeholder={`Message ${botName}…`}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            disabled={busy || !canSend}
            maxLength={8000}
          />
          <PromptInputFooter>
            {catalog ? (
              <ChatModelSelector
                catalog={catalog}
                selection={selection}
                disabled={busy}
                onChange={onSelectionChange}
              />
            ) : (
              <Skeleton
                aria-label="Loading AI providers"
                className="h-7 w-40"
              />
            )}
            <PromptInputSubmit
              className="ml-auto"
              status={status}
              onStop={() => {
                void stop()
                void transport.stopGeneration(chatId)
              }}
              disabled={!busy && (!canSend || !input.trim())}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  )
}
