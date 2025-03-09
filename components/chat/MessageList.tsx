'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { chatStore } from '@/store/chatStore'
import MessageContent from './MessageContent'
import { MessageContent as MessageContentType } from '@/types/api/openai'
import DynamicForm from '@/components/dynamicForms/DynamicForm'
import { renderContent as renderFormattedContent } from '@/lib/chat/renderServices'
import { ChatMessageAnnotation } from '@/types/database'

interface MessageListProps {
  isAssistantLoading?: boolean
  isStreamingActive?: boolean
  streamingContent?: string
}

interface ErrorWithMessage {
  message: string;
}

// Type guard to check if error has message property
const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'Unknown error occurred';
};

// Helper function to safely parse content
const renderContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content === 'object' && 'message' in content) {
    return content.message;
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content);
  }
  return String(content || '');
};

// Helper function that combines both renderContent functions
const renderMessageContent = (content: any, annotations: ChatMessageAnnotation[] = []): React.ReactNode => {
  // First, safely parse the content using the inline renderContent
  const parsedContent = renderContent(content);
  
  // Then, apply the enhanced formatting using the external renderFormattedContent
  return renderFormattedContent(parsedContent, annotations);
};

export const MessageList = React.memo(({ 
  isAssistantLoading, 
  isStreamingActive,
  streamingContent
}: MessageListProps) => {
  const { currentThread, fetchOpenAIMessages, error, setError } = chatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initial fetch of messages when thread ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentThread?.thread_id) {
        console.log('[MessageList] No thread ID available')
        return
      }

      setIsLoading(true)
      try {
        await fetchOpenAIMessages(currentThread.thread_id)
      } catch (error) {
        console.error('[MessageList] Error fetching messages:', error)
        setError(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [currentThread?.thread_id, fetchOpenAIMessages, setError])
 
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentThread?.messages?.length, streamingContent])

  if (!currentThread) {
    return (
      <div className="flex-1 p-4 text-center text-muted-foreground">
        Select or start a new conversation
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{getErrorMessage(error)}</span>
        </div>
      </div>
    )
  }

  const messages = currentThread.messages ? 
    [...currentThread.messages].sort((a, b) => a.created_at - b.created_at) : 
    []

  return (
    <ScrollArea className="h-100vh w-full overflow-y-auto mb-20">
      <div className="flex flex-col gap-4 p-4 pb-24">
        {messages.length === 0 && !isStreamingActive && !isAssistantLoading && (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((message, id) => (
          <div
            key={message.id || id}
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
                  message.content.map((content, i) => (
                    <React.Fragment key={`${message.id || id}-content-${i}`}>
                      {content.type === 'text' && content.text && (
                        <div>
                          {renderMessageContent(content.text.value, content.text.annotations || [])}
                        </div>
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
                  ))
                ) : (
                  <div>{renderMessageContent(message.content)}</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreamingActive && streamingContent && (
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
                {renderMessageContent(streamingContent)}
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
                <div className="flex items-center space-x-2">
                  <span>Thinking</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
})

MessageList.displayName = 'MessageList'
