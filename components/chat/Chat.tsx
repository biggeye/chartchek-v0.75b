'use client'

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import ChatInputArea from './ChatInputArea';
import { useChatStore } from '@/store/chatStore';
import { ChatMessageAttachment } from '@/types/database';
import { useStreaming } from '@/lib/useStreaming';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ChatProps {
  assistantId: string
}

export default function Chat({ assistantId }: ChatProps) {
  const {
    currentThread,
    createThread,
    sendMessage,
    setCurrentAssistantId
  } = useChatStore();

  // Integrate streaming functionality
  const { 
    streamingContent, 
    isStreamingActive, 
    streamError, 
    handleStream 
  } = useStreaming();

  // Local UI state
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Reference to the cancel function
  const cancelStreamRef = useRef<(() => void) | null>(null);
  
  // Get thread ID from current thread (or null if no thread exists)
  // Using a separate variable to ensure we always have the latest value
  const threadId = currentThread?.thread_id;
  useEffect(() => {
    setCurrentAssistantId(assistantId);
  }, [assistantId]);

  // Debug logs to track component state
  useEffect(() => {
    console.log('[Chat] Current thread updated:', { 
      threadId: currentThread?.thread_id,
      messageCount: currentThread?.messages?.length || 0 
    });
  }, [currentThread]);

  // Monitor streaming errors and update local error state
  useEffect(() => {
    if (streamError) {
      console.error('[Chat] Streaming error detected:', streamError);
      setLocalError(`Streaming error: ${streamError}`);
      
      // Auto-dismiss error after 5 seconds
      const timer = setTimeout(() => {
        setLocalError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [streamError]);

  // Function to cancel streaming
  const handleCancelStream = () => {
    if (cancelStreamRef.current) {
      console.log('[Chat] Cancelling stream');
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
  };

  const handleMessageSubmit = async (content: string, attachmentIds: string[]) => {
    setIsLoading(true);
    setLocalError(null);
    try {
      let threadToUse = threadId;
      if (!threadId) {
        console.log('[Chat] No current thread, creating a new one...');
        threadToUse = await createThread();
        console.log('[Chat] Created new thread:', threadToUse);
      }
      
      const attachments: ChatMessageAttachment[] = attachmentIds.map(id => ({ file_id: id }));
      if (threadToUse) {
        console.log('[Chat] Sending message to thread:', threadToUse);
        await sendMessage(assistantId, threadToUse, content, attachments);
        
        // Start streaming the response once the message is sent
        if (assistantId) {
          console.log('[Chat] Starting stream for thread:', threadToUse);
          // Store the cancel function in our ref for potential cancellation
          cancelStreamRef.current = await handleStream(threadToUse, assistantId);
        } else {
          console.error('[Chat] Missing assistant_id for thread:', threadToUse);
          setLocalError('Missing assistant ID. Cannot stream response.');
        }
      } else {
        throw new Error('Failed to create or find a thread for the message');
      }
    } catch (error) {
      console.error('[Chat] Error submitting message:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="chat-container flex flex-col h-full">
      <MessageList 
        isAssistantLoading={isLoading}
        isStreamingActive={isStreamingActive}
        streamingContent={streamingContent}
      />
      <div className="flex flex-col gap-2 mt-auto">
        {isStreamingActive && (
          <button
            onClick={handleCancelStream}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground mx-auto mb-1 hover:text-primary"
          >
            <XCircleIcon className="w-4 h-4" />
            Cancel generation
          </button>
        )}
        <ChatInputArea 
          onMessageSubmit={handleMessageSubmit}
          isSubmitting={isLoading || isStreamingActive}
        />
      </div>
      {(localError || streamError) && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          backgroundColor: 'red',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
        }}>
          {localError || streamError}
        </div>
      )}
    </div>
  );
}
