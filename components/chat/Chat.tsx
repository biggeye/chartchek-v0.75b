'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import ChatInputArea from './ChatInputArea';
import RunStatusIndicator from './RunStatusIndicator';
import ToolOutputForm from './ToolOutputForm';
import { chatStore } from '@/store/chatStore';
import { useNewStreamingStore } from '@/store/newStreamStore';
import { ChatMessageAttachment } from '@/types/database';
import { SendMessageResult } from '@/types/store/chat';
import { XCircleIcon } from '@heroicons/react/24/outline';

interface ChatProps {
  assistantId: string;
}

export default function Chat({ assistantId }: ChatProps) {
  const { currentThread, createThread, sendMessage, setCurrentAssistantId, activeRunStatus } = chatStore();
  const {
    currentStreamContent,
    isStreamingActive,
    streamError,
    startStream,
    cancelStream
  } = useNewStreamingStore();

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const threadId = currentThread?.thread_id;

  useEffect(() => {
    setCurrentAssistantId(assistantId);
  }, [assistantId]);

  const handleCancelRun = async () => {
    if (!currentThread?.thread_id || !activeRunStatus?.isActive) {
      console.log('[Chat] No active run to cancel');
      return;
    }
    try {
      setIsLoading(true);
      // Retrieve the latest run (if needed) from chatStore
      const latestRun = await chatStore.getState().getLatestRun(currentThread.thread_id);
      if (latestRun) {
        console.log(`[Chat] Attempting to cancel run ${latestRun.id}`);
        // If called without parameters in handleCancelRun
        cancelStream();
        console.log(`[Chat] Successfully cancelled run ${latestRun.id}`);
        await chatStore.getState().checkActiveRun(currentThread.thread_id);
      } else {
        console.log('[Chat] No run found to cancel');
        setLocalError('No active run found to cancel.');
      }
    } catch (error) {
      console.error('[Chat] Error cancelling run:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSubmit = async (content: string, attachmentIds: string[] = []) => {
    if (isLoading || isStreamingActive) {
      return;
    }
    if (activeRunStatus?.isActive) {
      setLocalError(
        'The assistant is still processing your previous request. ' +
        'Wait for it to complete or cancel it using the button below.'
      );
      if (currentThread?.thread_id) {
        chatStore.getState().checkActiveRun(currentThread.thread_id);
      }
      return;
    }
    try {
      setIsLoading(true);
      setLocalError(null);

      let threadToUse = currentThread?.thread_id;
      if (!threadToUse) {
        console.log('[Chat] No thread exists, creating a new one');
        threadToUse = await createThread(assistantId);
      }
      if (!threadToUse || !assistantId) {
        throw new Error('Thread ID or Assistant ID is missing');
      }
      const formattedAttachments: ChatMessageAttachment[] = attachmentIds.map(id => ({
        file_id: id,
        tools: [{ type: 'file_search' }]
      }));
      const result: SendMessageResult = await sendMessage(assistantId, threadToUse, content, formattedAttachments);
      if (!result.success) {
        console.error('[Chat] Error sending message:', result.error);
        setLocalError(result.error || 'Failed to send message');
        if (result.error?.includes('run is active')) {
          await chatStore.getState().checkActiveRun(threadToUse);
        }
        return;
      }
      if (assistantId) {
       useNewStreamingStore.setState({ isStreamingActive: true });
        await startStream(threadToUse, assistantId);
      } else {
        console.error('[Chat] Missing assistant_id for thread:', threadToUse);
        setLocalError('Missing assistant ID. Cannot stream response.');
      }
    } catch (error) {
      console.error('[Chat] Error submitting message:', error);
      setLocalError(error instanceof Error ? error.message : String(error));
    } finally {
      useNewStreamingStore.setState({ isStreamingActive: false });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <RunStatusIndicator onCancel={handleCancelRun} />

      {(localError || streamError) && (
        <div
          className="absolute top-0 left-0 right-0 z-10 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mx-4 mt-2"
          role="alert"
        >
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
        streamingContent={currentStreamContent}
      />

      {activeRunStatus?.requiresAction && activeRunStatus?.requiredAction?.toolCalls && (
        <div className="absolute bottom-20 left-0 right-0 z-10 mx-auto w-[80%]">
          <ToolOutputForm
            onSubmitSuccess={() => {
              setLocalError(null);
              if (currentThread?.thread_id) {
                chatStore.getState().checkActiveRun(currentThread.thread_id);
              }
            }}
            onCancel={handleCancelRun}
          />
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 mx-auto w-[80%]">
        <ChatInputArea onMessageSubmit={handleMessageSubmit} isSubmitting={isLoading || isStreamingActive} />
        {isStreamingActive && (
          <button
          onClick={() => threadId && cancelStream()}
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
