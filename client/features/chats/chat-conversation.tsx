"use client"

import { useMemo, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
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
import { useApiAuth } from "@/hooks/use-api-auth"
import { createChatTransport } from "@/services/chats/transport"

export function ChatConversation({
  chatId,
  botName,
}: {
  chatId: string
  botName: string
}) {
  const { getAccessToken } = useApiAuth()
  const transport = useMemo(
    () => createChatTransport(chatId, getAccessToken),
    [chatId, getAccessToken]
  )
  const [input, setInput] = useState("")
  const submittedInput = useRef("")
  const { messages, sendMessage, status, error, regenerate, stop } = useChat({
    id: chatId,
    transport,
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
              Could not get a reply. Please try again.
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
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
        <PromptInput
          onSubmit={async ({ text }) => {
            if (busy || !text.trim()) return
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
            disabled={busy}
            maxLength={8000}
          />
          <PromptInputFooter>
            <PromptInputSubmit
              className="ml-auto"
              status={status}
              onStop={() => void stop()}
              disabled={!busy && !input.trim()}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  )
}
