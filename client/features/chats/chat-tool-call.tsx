"use client"

import { isToolUIPart } from "ai"
import { CodeBlock } from "@/components/ai-elements/code-block"
import { Image } from "@/components/ai-elements/image"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import type { ChatUIMessage } from "@/services/chats/transport"

type ToolPart = Extract<
  ChatUIMessage["parts"][number],
  { type: `tool-${string}` }
>

const toolTitles: Partial<Record<ToolPart["type"], string>> = {
  "tool-bash": "Run command",
  "tool-readFile": "Read file",
  "tool-writeFile": "Write file",
  "tool-listFiles": "List files",
  "tool-mouseClick": "Click",
  "tool-mouseMove": "Move mouse",
  "tool-mouseScroll": "Scroll",
  "tool-keyboardType": "Type",
  "tool-keyboardPress": "Press key",
  "tool-viewScreen": "Look at screen",
  "tool-showScreen": "Show screen",
  "tool-handoff": "Hand off",
}

function isShowScreenOutput(
  part: ToolPart
): part is ToolPart & {
  type: "tool-showScreen"
  state: "output-available"
  output: { base64: string; mediaType: string }
} {
  return (
    part.type === "tool-showScreen" &&
    part.state === "output-available" &&
    !!part.output &&
    typeof part.output === "object" &&
    "base64" in part.output &&
    "mediaType" in part.output
  )
}

function ToolCallDetails({ part }: { part: ToolPart }) {
  const error = part.state === "output-error" ? part.errorText : undefined

  if (part.type === "tool-viewScreen" || part.type === "tool-showScreen") {
    return (
      <ToolOutput
        errorText={error}
        output={
          part.state === "output-available" ? (
            <p className="p-3 text-muted-foreground">
              {part.type === "tool-viewScreen"
                ? "Took a screenshot for its own use."
                : "Took a screenshot."}
            </p>
          ) : undefined
        }
      />
    )
  }

  if (part.type === "tool-bash") {
    const input =
      part.input && typeof part.input === "object" && "command" in part.input
        ? String((part.input as { command?: string }).command ?? "")
        : ""
    const output =
      part.state === "output-available" &&
      part.output &&
      typeof part.output === "object"
        ? (part.output as { output?: string; exitCode?: number })
        : null

    return (
      <>
        {input ? <CodeBlock code={input} language="bash" /> : null}
        <ToolOutput
          errorText={error}
          output={
            output ? (
              <CodeBlock
                code={output.output || `Exit code ${output.exitCode}`}
                language="log"
              />
            ) : undefined
          }
        />
      </>
    )
  }

  return (
    <>
      {part.input === undefined ? null : <ToolInput input={part.input} />}
      <ToolOutput
        errorText={error}
        output={part.state === "output-available" ? part.output : undefined}
      />
    </>
  )
}

export function ChatToolCall({ part }: { part: ToolPart }) {
  if (isShowScreenOutput(part)) {
    return (
      <Image
        alt="The sandbox's screen"
        base64={part.output.base64}
        className="border"
        mediaType={part.output.mediaType}
      />
    )
  }

  // The teammate's reply follows right below, so one line is enough
  if (
    part.type === "tool-handoff" &&
    part.state === "output-available" &&
    part.output &&
    typeof part.output === "object" &&
    "name" in part.output
  ) {
    return (
      <p className="text-muted-foreground">
        Handed off to {String((part.output as { name: string }).name)}
      </p>
    )
  }

  return (
    <Tool>
      <ToolHeader
        state={part.state}
        title={toolTitles[part.type] ?? part.type.replace(/^tool-/, "")}
        type={part.type}
      />
      <ToolContent>
        <ToolCallDetails part={part} />
      </ToolContent>
    </Tool>
  )
}

export function isChatToolPart(
  part: ChatUIMessage["parts"][number]
): part is ToolPart {
  return part.type !== "dynamic-tool" && isToolUIPart(part)
}
