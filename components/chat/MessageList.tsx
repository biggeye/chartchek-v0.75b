'use client'

import React, { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/chatStore'
import MessageContent from './MessageContent'
import { MessageContent as MessageContentType } from '@/types/database'
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
  const { currentThread, subscribeToRealtimeMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Subscribe to realtime messages via the store method.
  useEffect(() => {
    if (!currentThread?.thread_id || !subscribeToRealtimeMessages) {
      console.log('[MessageList] No thread ID or subscription method available');
      return;
    }

    const unsubscribe = subscribeToRealtimeMessages(currentThread.thread_id)
    
    return () => {

      unsubscribe();
    }
  }, [currentThread?.thread_id, subscribeToRealtimeMessages])

  // Scroll to the bottom whenever the messages update or streaming content changes.
  useEffect(() => {
    console.log('[MessageList] Content updated, scrolling to bottom', 
      currentThread?.messages?.length ? 
        `(${currentThread.messages.length} messages)` : 
        isStreamingActive ? '(streaming)' : '(no messages)');
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentThread?.messages, streamingContent, isStreamingActive])

  // Debug the message structure to identify any issues
  useEffect(() => {
    if (currentThread?.messages?.length) {
      console.log('[MessageList] Thread messages:', 
        currentThread.messages.map(m => ({
          id: m.id,
          role: m.role,
          contentType: Array.isArray(m.content) 
            ? 'array' 
            : (m.content?.type || typeof m.content),
          hasText: Array.isArray(m.content) 
            ? m.content.some(c => c.type === 'text') 
            : (m.content?.type === 'text')
        }))
      );
    }
  }, [currentThread?.messages]);

  const messages = currentThread?.messages || []

  // Helper function to normalize message content format
  const normalizeContent = (content: any): MessageContentType | null => {
    if (!content) return null;
    
    try {
      // Already in expected format with type property
      if (content.type && ['text', 'image_file', 'image_url'].includes(content.type)) {
        return content as MessageContentType;
      }
      
      // Handle text content as a string
      if (typeof content === 'string') {
        return {
          type: 'text',
          text: {
            value: content,
            annotations: []
          }
        };
      }
      
      // Handle legacy message format with a text property
      if (content.text) {
        if (typeof content.text === 'string') {
          // If text is a string, create a proper structure
          return {
            type: 'text',
            text: {
              value: content.text,
              annotations: []
            }
          };
        } else if (typeof content.text === 'object' && content.text.value) {
          // If text is already an object with value, ensure proper structure
          return {
            type: 'text',
            text: {
              value: content.text.value,
              annotations: content.text.annotations || []
            }
          };
        }
      }
      
      // Log unrecognized content for debugging
      console.warn('[MessageList] Unrecognized content format:', content);
      
      // Fallback: try to determine type from content structure
      if (content.image_file?.file_id) {
        return {
          type: 'image_file',
          image_file: { file_id: content.image_file.file_id }
        };
      } else if (content.image_url?.url) {
        return {
          type: 'image_url',
          image_url: { url: content.image_url.url }
        };
      }
      
      return null;
    } catch (error) {
      console.error('[MessageList] Error normalizing content:', error, content);
      return null;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] w-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 pb-24">
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={cn(
              'flex flex-col gap-2 p-4 rounded-lg',
              message.role === 'user' ? 'bg-muted/50' : 'bg-primary/5'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            
            {/* Handle the message content based on its type */}
            {(() => {
              // If content is an array, map over each item
              if (Array.isArray(message.content)) {
                return message.content.map((contentItem, index) => (
                  <MessageContent
                    key={`content-${message.id}-${index}`}
                    content={normalizeContent(contentItem) || contentItem}
                    isStreaming={false}
                  />
                ));
              }
              
              // If content is a single item
              return (
                <MessageContent 
                  content={normalizeContent(message.content) || message.content} 
                  isStreaming={false} 
                />
              );
            })()}
            
            {/* Render dynamic form if this message has associated form key */}
            {message.role === 'assistant' && 
             message.metadata && 
             message.metadata.formKey && (
              <div className="mt-4 p-4 border rounded-lg bg-background">
                <DynamicForm formKey={message.metadata.formKey} />
              </div>
            )}
          </div>
        ))}
        
        {/* Display streaming content when active */}
        {isStreamingActive && streamingContent && (
          <div 
            key="streaming-message"
            className={cn(
              'flex flex-col gap-2 p-4 rounded-lg',
              'bg-primary/5 border border-primary/20 animate-pulse-slow'
            )}>
            <div className="text-xs font-medium text-muted-foreground">
              Assistant <span className="text-primary">(typing...)</span>
            </div>
            <MessageContent 
              content={streamingContent}
              isStreaming={true}
            />
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
})

MessageList.displayName = 'MessageList'
