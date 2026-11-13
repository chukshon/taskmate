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
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { ChatAvatar } from "@/components/chat-avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatModelSelector } from "@/features/chats/chat-model-selector"
import {
  ChatToolCall,
  isChatToolPart,
} from "@/features/chats/chat-tool-call"
import type { ChatModelSelection } from "@/schemas/ai.schema"
import { useChatModelsQuery } from "@/services/chats/queries"
import { useApiAuth } from "@/hooks/use-api-auth"
import { usePaywall } from "@/hooks/use-paywall"
import { ApiError } from "@/lib/api-error"
import {
  UPGRADE_REQUIRED_MESSAGE,
  USAGE_LIMIT_ERROR,
} from "@/lib/billing"
import {
  loadChatTranscript,
  useChatTransport,
  type ChatUIMessage,
} from "@/services/chats/transport"

type ChatBot = {
  id: string
  name: string
  avatar: string
}

// A reply is one message even when a handoff changes who is writing it, so it
// is cut at each handoff and every stretch gets its own author. Only a group
// chat passes bots with a selected bot, so only its replies get a face.
function splitByAuthor(message: ChatUIMessage, bots: ChatBot[]) {
  const findBot = (botId?: string) => bots.find((bot) => bot.id === botId)

  let section = {
    author:
      message.role === "assistant"
        ? findBot(message.metadata?.botId)
        : undefined,
    parts: [] as ChatUIMessage["parts"],
  }
  const sections = [section]

  for (const part of message.parts) {
    section.parts.push(part)

    if (
      part.type === "tool-handoff" &&
      "state" in part &&
      part.state === "output-available" &&
      part.output &&
      typeof part.output === "object" &&
      "botId" in part.output
    ) {
      section = {
        author: findBot(String((part.output as { botId: string }).botId)),
        parts: [],
      }
      sections.push(section)
    }
  }

  return sections
}

export function ChatConversation({
  chatId,
  kind,
  bots,
  title,
}: {
  chatId: string
  kind: "direct" | "group"
  bots: ChatBot[]
  title: string
}) {
  const { getAccessToken } = useApiAuth()
  const {
    data: catalog,
    error: catalogError,
    refetch: reloadCatalog,
  } = useChatModelsQuery()
  const [selection, setSelection] = useState<ChatModelSelection | null>(null)
  const [botId, setBotId] = useState(bots[0]?.id)
  const selectedBot =
    kind === "group"
      ? (bots.find((bot) => bot.id === botId) ?? bots[0])
      : undefined
  const activeSelection: ChatModelSelection = {
    provider: selection?.provider ?? catalog?.defaultProvider ?? "google",
    model: selection?.model ?? "auto",
    ...(selectedBot ? { botId: selectedBot.id } : {}),
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
      title={title}
      bots={bots}
      selectedBot={selectedBot}
      onBotChange={setBotId}
      catalog={catalog}
      catalogError={catalogError}
      reloadCatalog={reloadCatalog}
      selection={activeSelection}
      onSelectionChange={(next) =>
        setSelection({
          provider: next.provider,
          model: next.model,
        })
      }
      initialMessages={messages}
      transport={transport}
    />
  )
}

function ChatMessages({
  chatId,
  title,
  bots,
  selectedBot,
  onBotChange,
  catalog,
  catalogError,
  reloadCatalog,
  selection,
  onSelectionChange,
  initialMessages,
  transport,
}: {
  chatId: string
  title: string
  bots: ChatBot[]
  selectedBot?: ChatBot
  onBotChange: (botId: string) => void
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
  const { checkPlan, showUpgradeRequired, showUsageLimit } = usePaywall()
  const provider = catalog?.providers.find(({ id }) => id === selection.provider)
  const canSend = Boolean(provider?.available)
  const replyName = selectedBot?.name ?? title
  const { messages, sendMessage, status, error, regenerate, stop } =
    useChat<ChatUIMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
      resume: initialMessages.length > 0,
      onError: (chatError) => {
        setInput(submittedInput.current)
        if (chatError.message === USAGE_LIMIT_ERROR) {
          showUsageLimit("ai")
          return
        }
        if (
          chatError.message === UPGRADE_REQUIRED_MESSAGE ||
          (chatError instanceof ApiError && chatError.status === 403)
        ) {
          showUpgradeRequired()
        }
      },
    })
  const busy = status === "submitted" || status === "streaming"

  return (
    <>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 && (
            <ConversationEmptyState
              title={`Chat with ${title}`}
              description="Send a message to start the conversation."
            />
          )}
          {messages.flatMap((message) => {
            // The bot a group chat's message was sent to
            const addressee =
              selectedBot && message.role === "user"
                ? bots.find((bot) => bot.id === message.metadata?.botId)
                : undefined
            const sections = selectedBot
              ? splitByAuthor(message, bots)
              : [
                  {
                    author: undefined,
                    parts: message.parts,
                  },
                ]

            return sections.map(({ author, parts }, sectionIndex) => {
              const renderedParts = parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <MessageResponse
                      key={`${message.id}-${sectionIndex}-${index}`}
                      // Flows the first paragraph inline, right after the tag
                      className={
                        addressee && index === 0
                          ? "inline [&>p:first-child]:inline"
                          : undefined
                      }
                    >
                      {part.text}
                    </MessageResponse>
                  )
                }
                if (isChatToolPart(part)) {
                  return <ChatToolCall key={part.toolCallId} part={part} />
                }
                return null
              })

              return (
                <Message
                  key={`${message.id}-${sectionIndex}`}
                  from={message.role}
                  className={author ? "flex-row items-start" : undefined}
                >
                  {author && (
                    <ChatAvatar seed={author.avatar} className="size-6" />
                  )}
                  <span className="sr-only">
                    {message.role === "user"
                      ? "You"
                      : (author?.name ?? replyName)}
                  </span>
                  <MessageContent>
                    {addressee ? (
                      // One block, so the tag and the text share a line and the text wraps under it
                      <div>
                        <Badge
                          variant="outline"
                          className="mr-1.5 max-w-40 pl-1 align-top"
                        >
                          <ChatAvatar
                            seed={addressee.avatar}
                            className="size-3.5"
                          />
                          <span className="truncate">{addressee.name}</span>
                        </Badge>
                        {renderedParts}
                      </div>
                    ) : (
                      renderedParts
                    )}
                  </MessageContent>
                </Message>
              )
            })
          })}
          {status === "submitted" && (
            <div role="status" aria-label={`${replyName} is thinking`}>
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
            // Throwing keeps the draft in the input
            if (!checkPlan("bots")) throw new Error(UPGRADE_REQUIRED_MESSAGE)
            const submitted = text.trim()
            submittedInput.current = submitted
            setInput("")
            // Kept on the message so the chat can show who it was for
            const metadata = selectedBot
              ? { botId: selectedBot.id }
              : undefined
            await sendMessage({ text: submitted, metadata })
          }}
        >
          <PromptInputTextarea
            aria-label="Message"
            placeholder={
              selectedBot
                ? `Message ${selectedBot.name}…`
                : `Message ${title}…`
            }
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            disabled={busy || !canSend}
            maxLength={8000}
          />
          <PromptInputFooter
            className={selectedBot ? undefined : "justify-end"}
          >
            {selectedBot && (
              <PromptInputTools>
                <PromptInputSelect
                  items={bots.map((bot) => ({
                    value: bot.id,
                    label: bot.name,
                  }))}
                  value={selectedBot.id}
                  onValueChange={(value) => {
                    if (typeof value === "string") onBotChange(value)
                  }}
                >
                  <PromptInputSelectTrigger aria-label="Bot to talk to">
                    <PromptInputSelectValue>
                      <ChatAvatar
                        seed={selectedBot.avatar}
                        className="size-5"
                      />
                      {selectedBot.name}
                    </PromptInputSelectValue>
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {bots.map((bot) => (
                      <PromptInputSelectItem key={bot.id} value={bot.id}>
                        <ChatAvatar seed={bot.avatar} className="size-5" />
                        {bot.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
            )}
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
