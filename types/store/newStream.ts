// Define the types for the newStreamStore

export interface NewStreamingState {
    // State properties
    isStreamingActive: boolean;
    currentStreamContent: string;
    streamError: string | null;
    currentRunId: string | null;
    abortController: AbortController | null;
    
    // Actions
    resetStream: () => void;
    setStreamContent: (content: string) => void;
    appendStreamContent: (content: string) => void;
    finalizeMessage: () => void;
    startStream: (threadId: string, assistantId: string) => Promise<void>;
    
    // Optional - can add if you need these
    setIsStreamingActive: (active: boolean) => void;
    cancelStream: () => void;
  }
  
  // If you have any other related types, add them here
  export interface StreamMessage {
    type: string;
    data: any;
  }
  
  export interface StreamDelta {
    delta: {
      content?: Array<{
        text: {
          value: string;
        }
      }>;
    };
    snapshot?: any;
  }