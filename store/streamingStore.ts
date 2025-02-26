import { create } from 'zustand';
import { StreamingState } from '@/types/store/streaming';
import { useChatStore } from '@/store/chatStore';
import { OpenAIStreamingEvent } from '@/types/api/openai';

export const useStreamingStore = create<StreamingState>((set, get) => ({
  isStreamingActive: false,
  currentStreamContent: '',
  streamError: null,
  
  

  startStream: () => {
    console.log('[streamingStore] Starting stream session');
    set({
      isStreamingActive: true,
      currentStreamContent: '',
      streamError: null,
    });
  },

  appendStream: (delta: string) => {
    if (!delta) return; // Skip empty deltas
    
    set((state: StreamingState) => {
      const newContent = state.currentStreamContent + delta;
      return {
        currentStreamContent: newContent,
      };
    });
  },

  cancelStream: () => {
    console.log('[streamingStore] Cancelling stream session');
    set((state: StreamingState) => {
      // Only log the error if we're actively streaming
      if (state.isStreamingActive) {
        console.warn('[streamingStore] Stream was cancelled');
      }
      
      return {
        isStreamingActive: false,
        currentStreamContent: '',
        streamError: state.streamError || 'Stream was cancelled',
      };
    });
  },

  endStream: () => {
    console.log('[streamingStore] Ending stream session');
    set((state: StreamingState) => {
      // Don't do anything if we're not streaming or have an empty stream content
      if (!state.isStreamingActive || !state.currentStreamContent.trim()) {
        console.warn('[streamingStore] No content to hand off or stream not active');
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: null,
        };
      }
      
      try {
        // Handoff: add the finalized message to the chat store
        console.log('[streamingStore] Handing off streamed content to chat store');
        useChatStore.getState().addAssistantMessage(state.currentStreamContent);
        
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: null,
        };
      } catch (error) {
        console.error('[streamingStore] Error during handoff to chat store:', error);
        return {
          isStreamingActive: false,
          currentStreamContent: '',
          streamError: error instanceof Error ? error.message : 'Unknown error during stream handoff',
        };
      }
    });
  },

  setStreamError: (error: string) => {
    console.error('[streamingStore] Stream error:', error);
    set({
      streamError: error,
      isStreamingActive: false,
    });
  },

  handleToolCall: (toolData: OpenAIStreamingEvent) => {
    console.log('[streamingStore] Tool call received:', toolData);
    // Handle tool calls based on their type
    if (toolData.type === 'toolCall') {
      console.log('[streamingStore] Processing tool call:', toolData.data);
      // Add implementation for handling different tool types
    }
  },
}));
