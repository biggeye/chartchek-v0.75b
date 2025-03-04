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

  export interface ThreadRun {
    id: string;
    created_at?: string | null;
    updated_at?: string | null;
    run_id: string;
    thread_id: string;
    assistant_id: string;
    user_id: string;
    status: string;
    started_at: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
    failed_at?: string | null;
    expires_at?: string | null;
    last_error?: string | null;
    model: string | null;
    instructions: string | null;
    tools?: any;
    metadata?: any;
    required_action?: any;
    prompt_tokens?: string | null;
    completion_tokens?: string | null;
    total_tokens?: string | null;
    temperature?: string | null;
    top_p?: string | null;
    max_prompt_tokens?: number | null;
    max_completion_tokens?: number | null;
    truncation_strategy?: string | null;
    response_format: any;
    tool_choice?: any;
    parallel_tool_calls?: boolean | null;
    additional_instructions?: string | null;
  }