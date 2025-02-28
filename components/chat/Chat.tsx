'use client'

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import ChatInputArea from './ChatInputArea';
import RunStatusIndicator from './RunStatusIndicator';
import ToolOutputForm from './ToolOutputForm';
import { useChatStore } from '@/store/chatStore';
import { useStreamingStore } from '@/store/streamingStore';
import { ChatMessageAttachment } from '@/types/database';
import { SendMessageResult } from '@/types/store/chat';
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
    setCurrentAssistantId,
    activeRunStatus,
  } = useChatStore();
  
  const { cancelRun } = useStreamingStore();

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

  // Debug log for activeRunStatus
  useEffect(() => {
    console.log('[Chat] Active run status updated:', { 
      isActive: activeRunStatus?.isActive,
      status: activeRunStatus?.status,
      requiresAction: activeRunStatus?.requiresAction,
      toolCallsCount: activeRunStatus?.requiredAction?.toolCalls?.length,
      toolCalls: activeRunStatus?.requiredAction?.toolCalls
    });
    
    // Debug check for tool output form conditions
    if (activeRunStatus) {
      const shouldShowForm = 
        activeRunStatus.requiresAction && 
        activeRunStatus.requiredAction?.toolCalls && 
        activeRunStatus.requiredAction.toolCalls.length > 0;
      
      console.log('[Chat] Should show tool output form:', shouldShowForm);
    }
  }, [activeRunStatus]);

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

  // Cancel the current run if it exists
  const handleCancelRun = async () => {
    if (!currentThread?.thread_id || !activeRunStatus?.isActive) {
      console.log('[Chat] No active run to cancel');
      return;
    }

    try {
      setIsLoading(true);
      // We need to get the latest run ID since we only track the status in activeRunStatus
      const latestRun = await useChatStore.getState().getLatestRun(currentThread.thread_id);
      
      if (latestRun) {
        console.log(`[Chat] Attempting to cancel run ${latestRun.id}`);
        const success = await cancelRun(currentThread.thread_id, latestRun.id);
        if (success) {
          console.log(`[Chat] Successfully cancelled run ${latestRun.id}`);
          // Update the run status after cancellation
          await useChatStore.getState().checkActiveRun(currentThread.thread_id);
        } else {
          setLocalError('Failed to cancel the run. Please try again.');
        }
      } else {
        console.log(`[Chat] No run found to cancel`);
        setLocalError('No active run found to cancel.');
      }
    } catch (error) {
      console.error('[Chat] Error cancelling run:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel the current stream
  const handleCancelStream = () => {
    if (cancelStreamRef.current) {
      console.log('[Chat] Cancelling stream');
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
  };

  // Handle new message submission from the user
  const handleMessageSubmit = async (content: string, attachmentIds: string[] = []) => {
    console.log('[Chat] Message submitted:', content.substring(0, 50) + (content.length > 50 ? '...' : ''));
    
    // Prevent submission if already loading or streaming
    if (isLoading || isStreamingActive) {
      console.log('[Chat] Cannot submit while loading or streaming');
      return;
    }
    
    // Check if there's an active run
    if (activeRunStatus?.isActive) {
      console.log('[Chat] Cannot submit while there is an active run');
      
      // Instead of just showing an error, ensure the cancel UI is visible
      // and explain the situation more clearly
      setLocalError(
        'The assistant is still processing your previous request. ' +
        'You can either wait for it to complete or cancel it using the button below.'
      );
      
      // Make sure the UI shows the cancel run elements
      // Force a re-check of the active run to ensure the UI state is correct
      if (currentThread?.thread_id) {
        useChatStore.getState().checkActiveRun(currentThread.thread_id);
      }
      
      return;
    }
    
    try {
      setIsLoading(true);
      setLocalError(null); // Clear any previous errors
      
      // Get the current thread ID or create a new thread
      let threadToUse = currentThread?.thread_id;
      
      // If no thread exists, create one
      if (!threadToUse) {
        console.log('[Chat] No thread exists, creating a new one');
        threadToUse = await createThread();
      }
      
      if (!threadToUse || !assistantId) {
        throw new Error('Thread ID or Assistant ID is missing');
      }
      
      // Convert attachment IDs to the expected format
      const formattedAttachments = attachmentIds?.map(id => ({ file_id: id })) || [];
      
      // The sendMessage now returns a status object with success and possibly error
      const result: SendMessageResult = await sendMessage(
        assistantId, 
        threadToUse,
        content,
        formattedAttachments
      );
      
      if (!result.success) {
        console.error('[Chat] Error sending message:', result.error);
        setLocalError(result.error || 'Failed to send message');
        
        // If the error is due to an active run, make sure the UI shows cancel elements
        if (result.error?.includes('run is active')) {
          await useChatStore.getState().checkActiveRun(threadToUse);
        }
        return;
      }
      
      // Message sent successfully, now start or continue the run
      // Start streaming the response once the message is sent
      if (assistantId) {
        console.log('[Chat] Starting stream for thread:', threadToUse);
        // Store the cancel function in our ref for potential cancellation
        cancelStreamRef.current = await handleStream(threadToUse, assistantId);
      } else {
        console.error('[Chat] Missing assistant_id for thread:', threadToUse);
        setLocalError('Missing assistant ID. Cannot stream response.');
      }
    } catch (error) {
      console.error('[Chat] Error submitting message:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <RunStatusIndicator onCancel={handleCancelRun} />
      
      {(localError || streamError) && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mx-4 mt-2" role="alert">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{localError || streamError}</p>
            </div>
          </div>
        </div>
      )}
      
      <MessageList 
        isAssistantLoading={isLoading}
        isStreamingActive={isStreamingActive}
        streamingContent={streamingContent}
      />
      
      {activeRunStatus?.requiresAction && 
       activeRunStatus?.requiredAction?.toolCalls && (
        <div className="absolute bottom-20 left-0 right-0 z-10 mx-auto w-[80%]">
          <ToolOutputForm 
            onSubmitSuccess={() => {
              // Clear any errors and refresh run status
              setLocalError(null);
              if (currentThread?.thread_id) {
                useChatStore.getState().checkActiveRun(currentThread.thread_id);
              }
            }}
            onCancel={handleCancelRun}
          />
        </div>
      )}
      
      <div className="absolute bottom-4 left-0 right-0 mx-auto w-[80%]">
        <ChatInputArea
          onMessageSubmit={handleMessageSubmit}
          isSubmitting={isLoading || isStreamingActive}
        />
        
        {isStreamingActive && (
          <button
            onClick={handleCancelStream}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground mx-auto mt-1 hover:text-primary"
          >
            <XCircleIcon className="w-4 h-4" />
            Cancel generation
          </button>
        )}
      </div>
    </div>
  );
}
