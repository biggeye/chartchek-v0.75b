'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageContent as MessageContentComponent } from './MessageContent'
import { Message, MessageContent } from '@/types/api/openai/messages'

interface MessageListProps {
  messages?: Message[]
  streamingContent?: MessageContent[]
}

export function MessageList({ messages = [], streamingContent = [] }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Console log to check the messages being passed
  console.log('Messages to display:', messages);

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] w-full">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id || `temp-${message.created_at}`}
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