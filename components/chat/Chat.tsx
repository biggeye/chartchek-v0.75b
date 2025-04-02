'use client';

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import RunStatusIndicator from './RunStatusIndicator';
import { useLegacyChatStore } from '@/store/chat/legacyChatStore';
import { useStreamStore } from '@/store/chat/streamStore';
import { XCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ToolCallDebugger from './ToolCallDebugger';

export default function Chat() {
  const { currentThread, createThread, sendMessage, setCurrentAssistantId, activeRunStatus, currentAssistantId } = useLegacyChatStore();
  const {
    currentStreamContent,
    isStreamingActive,
    streamError,
    startStream,
    cancelStream,
    isFormProcessing,
    currentFormKey,
    formData,
    toolCallsInProgress,
    currentRunId
  } = useStreamStore();

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const threadId = currentThread?.thread_id;
  const assistantId = currentAssistantId;

  const handleCancelRun = async () => {
    // Clear any existing errors first
    setLocalError(null);
    
    // If there's no active thread or run, just exit gracefully
    if (!currentThread?.thread_id) {
      console.log('[Chat] No active thread to cancel');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Cancel any active stream regardless of run status
      cancelStream(currentThread.thread_id, currentRunId || undefined);
      console.log(`[Chat] Cancelled any active streams for thread ${currentThread.thread_id}`);
      
     
    } catch (error) {
      console.error('[Chat] Error during cancel operation:', error);
      // Don't set error state - we're trying to exit gracefully
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed t-16 flex flex-col h-full max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Status indicators are now placed in a fixed position at the bottom of the screen */}
      <div className="fixed bottom-24 right-5 z-40 w-80">
        <RunStatusIndicator onCancel={handleCancelRun} />
      </div>

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

      {isFormProcessing && currentFormKey === 'biopsychsocial' && (
        <div
          className="absolute top-0 left-0 right-0 z-10 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mx-4 mt-2"
          role="alert"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Creating BioPsychSocial Assessment</p>
              <p className="text-xs mt-1">
                Generating assessment for {formData.firstName} {formData.lastName}...
              </p>
            </div>
          </div>
        </div>
      )}

      {toolCallsInProgress.length > 0 && !isFormProcessing && (
        <div
          className="absolute top-0 left-0 right-0 z-10 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md mx-4 mt-2"
          role="alert"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Function Call in Progress</p>
              <p className="text-xs mt-1">
                {toolCallsInProgress.map((tool: any, index: number) => (
                  <span key={index} className="block">
                    {tool.function?.name || 'Unknown function'} 
                    {tool.id && <span className="text-xs opacity-75"> (ID: {tool.id.substring(0, 8)}...)</span>}
                  </span>
                ))}
              </p>
              <div className="mt-2 text-xs">
                <details className="cursor-pointer">
                  <summary>Debug Details</summary>
                  <ToolCallDebugger toolCalls={toolCallsInProgress} runId={currentRunId} />
                </details>
              </div>
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