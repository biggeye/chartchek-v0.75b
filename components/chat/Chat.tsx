'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import RunStatusIndicator from './RunStatusIndicator';
import { chatStore } from '@/store/chatStore';
import { useStreamStore } from '@/store/streamStore';
import { XCircleIcon } from '@heroicons/react/24/outline';


export default function Chat() {
  const { currentThread, createThread, sendMessage, setCurrentAssistantId, activeRunStatus, currentAssistantId } = chatStore();
  const {
    currentStreamContent,
    isStreamingActive,
    streamError,
    startStream,
    cancelStream
  } = useStreamStore();

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const threadId = currentThread?.thread_id;
  const assistantId = currentAssistantId;
 

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
        // Pass threadId and runId to cancelStream
        cancelStream(currentThread.thread_id, latestRun.id);
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



  return (
    <div className="relative flex flex-col h-full max-h-[calc(100vh-1rem)] overflow-hidden">
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

      
      {isStreamingActive && (
        <button
          onClick={() => threadId && cancelStream(threadId)}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground mx-auto mt-1 mb-1 hover:text-primary"
        >
          <XCircleIcon className="w-4 h-4" />
          Cancel generation
        </button>
      )}
      <MessageList
        isAssistantLoading={isLoading}
        isStreamingActive={isStreamingActive}
        streamingContent={currentStreamContent}
      />
    </div>
  );
}