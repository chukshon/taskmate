import { auth } from "@clerk/nextjs/server"

import { ChatFeature } from "@/features/chats"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  await auth.protect()
  const { chatId } = await params

  return <ChatFeature chatId={chatId} />
}
