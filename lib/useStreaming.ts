import { useCallback } from 'react';
import { useStreamingStore } from '@/store/streamingStore';
import { streamAssistantResponse } from '@/lib/streamingServices';

export const useStreaming = () => {
  // Extract all necessary state and methods from the streaming store
  const { 
    isStreamingActive, 
    currentStreamContent, 
    streamError,
    startStream, 
    appendStream, 
    cancelStream, 
    endStream, 
    setStreamError,
    handleToolCall,
    setCurrentMessageId
  } = useStreamingStore();

  /**
   * Handles streaming a response from the assistant
   * @param threadId The ID of the thread to stream responses from
   * @param assistantId The ID of the assistant to use for streaming
   * @returns A cancel function that can be used to stop the stream
   */
  const handleStream = useCallback(async (threadId: string, assistantId: string) => {
    if (!threadId || !assistantId) {
      const errorMessage = `Missing required parameters: ${!threadId ? 'threadId' : 'assistantId'}`;
      console.error('[useStreaming] ' + errorMessage);
      setStreamError(errorMessage);
      return () => {}; // Return empty cancel function
    }

    try {
      // Start/reset the streaming store state
      startStream(); 

      // Call the streaming service. It will update the store via our callbacks.
      const { cancel } = await streamAssistantResponse(threadId, assistantId, {
        onTextDelta: (delta: string) => {
          appendStream(delta);
        },
        onMessageCreated: (message: any) => {
          console.log('[useStreaming] Message created with ID:', message.id);
          if (message.id) {
            setCurrentMessageId(message.id);
          }
        },
        onToolCall: (toolData: any) => {
          console.log('[useStreaming] Tool call received:', toolData);
          handleToolCall(toolData);
        },
        onToolCallCreated: (toolCall: any) => {
          console.log('[useStreaming] Tool call created:', toolCall);
          handleToolCall(toolCall);
        },
        onToolCallDelta: (toolCallDelta: any) => {
          console.log('[useStreaming] Tool call delta:', toolCallDelta);
          if (toolCallDelta.snapshot) {
            handleToolCall(toolCallDelta.snapshot);
          } else {
            handleToolCall(toolCallDelta);
          }
        },
        onEnd: () => {
          console.log('[useStreaming] Stream ended for thread:', threadId);
          endStream();
        },
        onError: (error: any) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[useStreaming] Streaming error:', errorMessage);
          setStreamError(errorMessage);
        },
      });

      // Return the cancel function so it can be called from outside
      return cancel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[useStreaming] Error setting up stream:', errorMessage);
      setStreamError(errorMessage);
      return () => {}; // Return empty cancel function
    }
  }, [startStream, appendStream, cancelStream, endStream, setStreamError, handleToolCall, setCurrentMessageId]);

  return { 
    streamingContent: currentStreamContent, 
    isStreamingActive, 
    streamError, 
    handleStream 
  };
};
