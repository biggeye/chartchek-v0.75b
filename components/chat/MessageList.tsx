'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageContent as MessageContentComponent } from './MessageContent'
import { OpenAIMessage } from '@/types/api/openai/messages'
import { ChatMessageAnnotation } from '@/types/store/client';
import { MessageContent } from '@/types/database'
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useClientStore } from '@/store/clientStore';
import { renderContent } from '@/lib/chat/renderServices';
import { Message } from '@/types/store/client';

interface MessageListProps {
  messages: OpenAIMessage[]
  streamingContent?: MessageContent[]
}

export const MessageList = React.memo(({ messages, streamingContent }: MessageListProps) => {
  const supabase = createClient();
  const { currentConversation, currentThreadId, setCurrentConversation } = useClientStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Real-time subscription
  useEffect(() => {
    if (!currentThreadId) return

    const channel = supabase
      .channel('realtime-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${currentThreadId}`
      }, (payload) => {
        setCurrentConversation([...currentConversation, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentThreadId, currentConversation])

  // Initial fetch
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentThreadId) {
        const messages = await useClientStore.getState().fetchThreadMessages(currentThreadId)
        setCurrentConversation(messages)
      }
    }
    fetchMessages()
  }, [currentThreadId])

  useEffect(() => {
    if (messages.length > 0) {
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <ScrollArea className="h-[calc(100vh-5rem)] w-full mt-4.5 top-6">
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
            {message.content && Array.isArray(message.content) && message.content[0] && message.content[0].text ? (
              renderContent(
                message.content[0].text.value,
                message.content[0].text.annotations || []
              )
            ) : message.content && !Array.isArray(message.content) && message.content.text ? (
              renderContent(
                message.content.text.value,
                message.content.text.annotations || []
              )
            ) : null}
            {message.content && message.content.text && Array.isArray(message.content.text.annotations) && (
              <div className="annotation-markers">
                {message.content.text.annotations.map((ann) => (
                  <sup 
                    key={`${message.id}-ann-${ann.start_index}-${ann.end_index}`}
                    className="annotation-marker"
                    title={ann.file_citation ? `${ann.type}: ${ann.file_citation.file_id}` : 'No citation available'}
                  >
                    [{ann.start_index}-{ann.end_index}]
                  </sup>
                ))}
              </div>
            )}
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
  );
});
