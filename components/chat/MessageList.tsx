'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageContent as MessageContentComponent } from './MessageContent'
import { cn } from '@/lib/utils'
import { Message, MessageContent } from '@/types/types'

interface MessageListProps {
  messages?: Message[]
  streamingContent?: MessageContent[]
}

export function MessageList({ messages = [], streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Sort messages by creation time
  const sortedMessages = [...messages].sort((a, b) => a.created_at - b.created_at)

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        {sortedMessages.map((message) => (
          <div
            key={message.id || `msg-${message.created_at}`}
            className={cn(
              'flex flex-col gap-2 p-4 rounded-lg',
              message.role === 'user' ? 'bg-muted/50' : 'bg-primary/5'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <MessageContentComponent content={message.content} />
          </div>
        ))}
        
        {streamingContent && streamingContent.length > 0 && (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-primary/5">
            <div className="text-xs font-medium text-muted-foreground">
              Assistant
            </div>
            <MessageContentComponent content={streamingContent} isStreaming />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}