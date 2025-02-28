'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { chatStore } from '@/store/chatStore'
import MessageContent from './MessageContent'
import { MessageContent as MessageContentType } from '@/types/api/openai'
import DynamicForm from '@/lib/forms/DynamicForm'

interface MessageListProps {
  isAssistantLoading?: boolean
  isStreamingActive?: boolean
  streamingContent?: string
}

export const MessageList = React.memo(({ 
  isAssistantLoading, 
  isStreamingActive,
  streamingContent
}: MessageListProps) => {
  const { currentThread, fetchOpenAIMessages } = chatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentMessages = chatStore((state) => state.currentThread?.messages);

  // Initial fetch of messages when thread ID changes
  useEffect(() => {
    if (!currentThread?.thread_id) {
      console.log('[MessageList] No thread ID available');
      return;
    }
    fetchOpenAIMessages(currentThread.thread_id).catch(error => {
      console.error('[MessageList] Error fetching messages:', error);
    });
  }, [currentThread?.thread_id, fetchOpenAIMessages]);
 
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentThread?.messages?.length, streamingContent])

  if (!currentThread) {
    return <div className="flex-1 p-4 text-center text-muted-foreground">No active conversation</div>
  }

  const messages = currentThread.messages ? 
    [...currentThread.messages].sort((a, b) => a.created_at - b.created_at) : 
    [];
  console.log('[MessageList] Messages:', messages);
  console.log('[MessageList] Streaming content:', streamingContent);
  return (
    <ScrollArea className="h-[calc(100vh-10rem)] w-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 pb-24">
 

        {messages.map((message, id) => (
          <div
            key={id}
            className={cn(
              'flex w-full max-w-screen-md items-start gap-2 rounded-lg px-4 py-2',
              message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted'
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="text-sm opacity-90">
                {Array.isArray(message.content) ? (
               message.content.map((content, i) =>  (
                  <React.Fragment key={`${message.id}-content-${i}`}>
                  {content.type === 'text' && content.text && (
                    <div>{content.text.value}</div>
                  )}
                  {content.type === 'image_file' && content.image_file && (
                    <div>
                      <img 
                        src={`/api/files/${content.image_file.file_id}`} 
                        alt="Image attachment" 
                        className="max-w-xs rounded-md"
                      />
                    </div>
                  )}
                </React.Fragment>
                ))) : (
                  <div>{message.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreamingActive && (
          <div
            className={cn(
              'flex w-full max-w-screen-md items-start gap-2 rounded-lg px-4 py-2',
              'mr-auto bg-muted'
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold">
                Assistant is typing...
              </div>
              <div className="text-sm opacity-90">
                {streamingContent || '...'}
              </div>
            </div>
          </div>
        )}

        {isAssistantLoading && !isStreamingActive && (
          <div
            className={cn(
              'flex w-full max-w-screen-md items-start gap-2 rounded-lg px-4 py-2',
              'mr-auto bg-muted'
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold">
                Assistant
              </div>
              <div className="text-sm opacity-90">
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
})
