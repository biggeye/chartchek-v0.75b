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
    createThread,
    setCurrentAssistantId,
    sendMessage,
    error: storeError,
    setError
  } = useClientStore();
  
  const setCurrentThreadId = useClientStore((state) => state.setCurrentThreadId);

  const { streamingContent, handleStream, setStreamingContent } = useStreaming();
  
  const messages = useClientStore((state) => state.currentConversation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const currentThreadId = useClientStore((state) => state.currentThreadId);

  const handleMessageSubmit = async (content: string, attachments: string[]) => {
    try {
      console.log('[Chat] Submitting message:', content, attachments, currentThreadId);
      if (!currentThreadId) {
        const newThreadId = await createThread(currentAssistantId);
        console.log('[Chat] Created new thread:', newThreadId);
        if (newThreadId) {
        setCurrentThreadId(newThreadId);
        }
      }
      await sendMessage(currentThreadId, content, attachments);
      await handleStream();
    } catch (error) {
      console.error('[Chat] Error submitting message:', error);
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