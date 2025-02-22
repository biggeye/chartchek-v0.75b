'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageList } from './MessageList'
import { useClientStore } from '@/store/clientStore'
import { useDocumentStore } from '@/store/documentStore'
import { useStreaming } from '@/lib/useStreaming';
import ChatInputArea from './ChatInputArea';

interface AssistantChatProps {
  assistantId: string
}

export default function Chat({ assistantId }: AssistantChatProps) {

  const {
    currentAssistantId,
    ensureThread,
    setCurrentAssistantId,
    sendMessage,
    error: storeError,
    setError
  } = useClientStore();
  


  const { streamingContent, handleStream, setStreamingContent } = useStreaming();
  
  const messages = useClientStore((state) => state.currentConversation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const currentThreadId = useClientStore((state) => state.currentThreadId);
  
  const handleMessageSubmit = async (content: string, attachments: string[]) => {
    try {
      setIsLoading(true);
      setLocalError(null);
      
      // Ensure we have a valid thread before sending message
      const threadId = await ensureThread(currentAssistantId);
      console.log('[Chat: handleMessageSubmit] threadId: ', threadId);
      await sendMessage(threadId, content, attachments);
      await handleStream();
    } catch (error) {
      console.error('[Chat] Error submitting message:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentAssistantId(assistantId);
  }, [assistantId, setCurrentAssistantId]);

  return (
    <div className="chat-container">
      <MessageList messages={messages} streamingContent={streamingContent} />
      <ChatInputArea 
        onMessageSubmit={handleMessageSubmit}
        isSubmitting={isLoading}
      />
      {(error) && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          maxWidth: '24rem',
          animation: 'slideIn 0.2s ease-out',
        }}>

        </div>
      )}
    </div>
  )
}