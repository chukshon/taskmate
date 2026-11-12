import { auth } from "@clerk/nextjs/server"

import { DesktopPanel, DesktopPanelProvider } from "@/components/desktop-panel"
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ChatFeature } from "@/features/chats"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  await auth.protect()
  const { chatId } = await params

  return (
    <DesktopPanelProvider key={chatId} chatId={chatId}>
      <div className="h-svh">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="chat" minSize="30%">
            <ChatFeature chatId={chatId} />
          </ResizablePanel>
          <DesktopPanel chatId={chatId} />
        </ResizablePanelGroup>
      </div>
    </DesktopPanelProvider>
  )
}
