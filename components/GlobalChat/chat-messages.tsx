"use client"

import { useRef, useEffect, useState } from "react"
import { useChatStore } from "@/store/chat/chatStore"
import ChatMessage from "./chat-message"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProgressIndicator, { PROGRESS_STEPS } from "./progress-indicator"

export default function ChatMessages() {
  const { messages, isGenerating, isFullScreen } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Hide welcome message when first message is sent
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    }
  }, [messages])

  // Simulate progress through steps when generating
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < PROGRESS_STEPS.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 1200)

      return () => {
        clearInterval(interval)
        setCurrentStep(0)
      }
    }
  }, [isGenerating])

  // Empty state with welcome message
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-sans text-emerald-700 font-medium tracking-tight w-full px-4">
          chartChek: <span className="animate-pulse">_</span>
        </div>
      </div>
    )
  }

  // In regular mode (not full screen), only show the latest assistant message and progress
  if (!isFullScreen) {
    const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")

    return (
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollRef}
        style={{
          backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.03) 50%, transparent 50%)",
          backgroundSize: "100% 4px",
        }}
      >
        <div className="space-y-4">
          {isGenerating ? (
            <div className="font-sans text-emerald-700 font-medium tracking-tight">
              chartChek: {PROGRESS_STEPS[currentStep]}
            </div>
          ) : null}

          {lastAssistantMessage ? (
            <div className="font-sans text-emerald-700 font-medium tracking-tight">
              chartChek: {lastAssistantMessage.content}
            </div>
          ) : (
            <div className="font-sans text-emerald-700 font-medium tracking-tight">
              chartChek: <span className="animate-pulse">_</span>
            </div>
          )}
        </div>
      </ScrollArea>
    )
  }

  // In full screen mode, show all messages
  return (
    <ScrollArea
      className="flex-1 p-4"
      ref={scrollRef}
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(120, 120, 255, 0.03) 0%, transparent 80%)",
      }}
    >
      <div className="space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLoading={isGenerating && index === messages.length - 1 && message.role === "assistant"}
          />
        ))}

        {isGenerating && <ProgressIndicator />}
      </div>
    </ScrollArea>
  )
}

