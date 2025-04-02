"use client"

import { useState } from "react"
import { Copy, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import React from "react"

// Add keyframes for text flicker animation
const textFlickerKeyframes = `
  @keyframes textFlicker {
    0% {
      opacity: 0.97;
    }
    100% {
      opacity: 1;
    }
  }
`

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system"
    content: string
  }
  isLoading?: boolean
}

export default function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  // Add useEffect to inject the keyframes
  React.useEffect(() => {
    // Add keyframes to the document
    const styleElement = document.createElement("style")
    styleElement.textContent = textFlickerKeyframes
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  return (
    <div
      className={cn(
        "w-full transition-all",
        isUser ? "bg-muted/50 p-4 rounded-md flex gap-3" : "",
        isSystem && "bg-yellow-500/10 p-4 rounded-md flex gap-3",
      )}
      style={{
        boxShadow: isUser || isSystem ? "0 1px 2px rgba(0, 0, 0, 0.05)" : "none",
        animation: isLoading ? "textFlicker 0.01s infinite alternate" : "none",
      }}
    >
      {isUser || isSystem ? (
        <Avatar
          className={cn("h-8 w-8 rounded-md", isUser ? "bg-primary" : "bg-blue-500", isSystem && "bg-yellow-500")}
        >
          <span className="text-xs font-semibold text-white">{isUser ? "U" : isSystem ? "S" : "A"}</span>
        </Avatar>
      ) : null}

      <div className={cn("flex-1 space-y-2", !isUser && !isSystem && "font-sans text-emerald-700")}>
        <div className={cn("prose prose-sm", !isUser && !isSystem && "dark:prose-invert font-medium tracking-tight")}>
          {isLoading && message.content === "" ? (
            <div className="font-sans text-emerald-700 font-medium tracking-tight">
              <span className="animate-pulse">_</span>
            </div>
          ) : (
            <div className="relative">
              {isUser ? (
                <div>userName: {message.content}</div>
              ) : isSystem ? (
                <div>system: {message.content}</div>
              ) : (
                <div>{message.content}</div>
              )}
              {!isUser && !isSystem && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.1) 50%, transparent 50%)",
                    backgroundSize: "100% 4px",
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {(isUser || isSystem) && message.content && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
        >
          {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )
}

