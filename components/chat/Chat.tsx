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

export function Chat({ assistantId }: AssistantChatProps) {

  const {
    currentAssistantId,
    createThread,
    fetchThreadMessages,
    setCurrentThreadId,
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

  const handleSubmit = async (message: string) => {
    if (isLoading || !message.trim()) return;

    if (!currentThreadId) {
      const newThreadId = await createThread(assistantId);
      if (newThreadId) {
        setCurrentThreadId(newThreadId);
      }
    }

    const formData = new FormData();
    formData.append('content', message);
    formData.append('thread_id', currentThreadId);
    formData.append('role', 'user');

    const sentMessage = await sendMessage(currentThreadId, formData);
    const result = await sentMessage.json();

    if (result.error) {
      setLocalError(result.error);
    } else {
      try {
        await handleStream();

      } catch (error) {

        setLocalError('Failed to send message. Please try again.');
      } finally {
        fetchThreadMessages(currentThreadId);
        setIsLoading(false);
      }
    };
  };


useEffect(() => {
  setCurrentAssistantId(assistantId);
}, [assistantId, setCurrentAssistantId]);

return (
  <div className="chat-container">
    <MessageList messages={messages} streamingContent={streamingContent} />
    <ChatInputArea
      threadId={currentThreadId}
      onSubmit={handleSubmit}
      isLoading={isLoading}
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