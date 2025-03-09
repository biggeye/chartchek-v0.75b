'use client'

import Chat from "@/components/chat/Chat"
import { assistantRoster } from "@/lib/assistant/roster"

export default function ChatPage() {
  // Use the default assistant from the roster
  const defaultAssistantId = "asst_9RqcRDt3vKUEFiQeA0HfLC08" // Default ChartChat assistant

  return (
    <div className="h-full w-full flex flex-col">
      <Chat assistantId={defaultAssistantId} />
    </div>
  )
}
