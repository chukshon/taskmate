import { Avatar, Style } from "@dicebear/core"
import definition from "@dicebear/styles/moods.json" with { type: "json" }
import Image from "next/image"

import { cn } from "@/lib/utils"

const style = new Style(definition)

type ChatAvatarProps = {
  seed: string
  animated?: boolean
  className?: string
}

function ChatAvatar({ seed, animated = false, className }: ChatAvatarProps) {
  const avatar = new Avatar(style, {
    seed,
    ...(animated && { tags: ["animation"] }),
  })

  return (
    <Image
      data-slot="chat-avatar"
      src={avatar.toDataUri()}
      alt=""
      width={32}
      height={32}
      unoptimized
      className={cn("size-8 shrink-0", className)}
    />
  )
}

export { ChatAvatar }
