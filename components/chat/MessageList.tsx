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
import Image from 'next/image'
import { assistantRoster } from '@/lib/assistant/roster'
import { ThreadMessage } from '@/types/database'
import { useStreamStore } from '@/store/streamStore'

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

// Helper function to get the assistant logo path based on assistant ID
const getAssistantLogoPath = (assistantId: string | null | undefined): string | undefined => {
  if (!assistantId) return undefined;

  // Map OpenAI assistant IDs to their logo paths
  switch (assistantId) {
    case "asst_7rzhAUWAamYufZJjZeKYkX1t": // Joint Commission
      return '/ext-logos/tjc-logo.jpg';
    case "asst_9RqcRDt3vKUEFiQeA0HfLC08": // Default/ChartChat
      return undefined;
    // Add more cases as needed for other assistants
    default:
      return undefined;
  }
};

// Helper function to get the assistant name based on assistant ID
const getAssistantName = (assistantId: string | null | undefined): string => {
  if (!assistantId) return 'Assistant';

  // Find the assistant in the roster with explicit grouping for the Boolean logic
  const assistant = Object.entries(assistantRoster).find(
    ([, assistant]) =>
      ((assistant.key === 'tjc' && assistantId === "asst_7rzhAUWAamYufZJjZeKYkX1t") ||
       (assistant.key === 'default' && assistantId === "asst_9RqcRDt3vKUEFiQeA0HfLC08"))
  );

  return assistant ? assistant[1].name : 'Assistant';
};

export const MessageList = React.memo(({
  isAssistantLoading,
  isStreamingActive,
  streamingContent
}: MessageListProps) => {
  const { currentThread, fetchOpenAIMessages, error, setError } = chatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showStreamingMessage, setShowStreamingMessage] = useState(false)
  const [fadeOutActive, setFadeOutActive] = useState(false)
  const [previousStreamContent, setPreviousStreamContent] = useState<string | null>(null)

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

  // Handle streaming state changes
  useEffect(() => {
    if (isStreamingActive) {
      // When streaming starts, show the streaming message and reset fade state
      setShowStreamingMessage(true)
      setFadeOutActive(false)

      // Store the current streaming content
      if (streamingContent) {
        setPreviousStreamContent(streamingContent)
      }
    } else if (showStreamingMessage && previousStreamContent) {
      // When streaming ends, start the fade out animation
      setFadeOutActive(true)

      // After fade out animation completes, hide the streaming message
      const timer = setTimeout(() => {
        setShowStreamingMessage(false)

        // Fetch the latest messages after streaming ends
        if (currentThread?.thread_id) {
          fetchOpenAIMessages(currentThread.thread_id)
        }
      }, 3000) // Match this with the CSS transition duration

      return () => clearTimeout(timer)
    }
  }, [isStreamingActive, showStreamingMessage, previousStreamContent, currentThread?.thread_id, fetchOpenAIMessages, streamingContent])

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
    <ScrollArea className="h-full w-full overflow-y-auto mb-20">
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
                {message.role === 'user' ? 'You' : (
                  <div className="flex items-center gap-2">
                    {(() => {
                      const logoPath = getAssistantLogoPath(message.assistant_id);
                      return logoPath ? (
                        <Image
                          src={logoPath}
                          alt={getAssistantName(message.assistant_id) || 'Assistant'}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      ) : null;
                    })()}
                    <span>{getAssistantName(message.assistant_id)}</span>
                  </div>
                )}
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

        {showStreamingMessage && (previousStreamContent || streamingContent) && (
          <div
            className={cn(
              'flex w-full max-w-screen-md items-start gap-2 rounded-lg px-4 py-2',
              'mr-auto bg-muted transition-opacity duration-[3000ms] ease-in-out',
              fadeOutActive ? 'opacity-0' : 'opacity-100'
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold">
                Assistant is typing...
              </div>
              <div className="text-sm opacity-90">
                {renderMessageContent(streamingContent || previousStreamContent || '')}
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