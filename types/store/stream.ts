// Define the types for the streamStore

import { OpenAIStreamingEvent } from '@/types/api/openai';

export interface StreamingState {
  // State properties
  isStreamingActive: boolean;
  currentStreamContent: string;
  streamError: string | null;
  currentRunId: string | null;
  abortController: AbortController | null;
  
  // Additional state properties from streaming.ts
  currentFormKey: string | null;
  currentMessageId: string | null;
  isFormProcessing: boolean;
  formData: Record<string, any>;
  userId: string | null;
  
  // Core actions
  resetStream: () => void;
  setStreamContent: (content: string) => void;
  appendStreamContent: (content: string) => void;
  finalizeMessage: () => void;
  startStream: (threadId: string, assistantId: string, additionalInstructions?: string) => Promise<void>;
  setIsStreamingActive: (active: boolean) => void;
  cancelStream: (threadId?: string, runId?: string) => Promise<boolean> | void;
  
  // Additional actions from streaming.ts
  endStream: (savedMessageId?: string) => void;
  setStreamError: (error: string | null) => void;
  initialize: () => Promise<void>;
  
  // Form handling
  setCurrentFormKey: (formKey: string | null) => void;
  determineFormKey: (description: string) => Promise<string>;
  updateFormData: (data: Record<string, any>) => void;
  clearFormData: () => void;
  setFormProcessing: (isProcessing: boolean) => void;
  submitForm: (threadId: string, runId: string, toolCallId: string, formData: Record<string, any>) => Promise<boolean>;
  
  // Stream content management
  updateStreamContent: (content: string) => void;
  processStreamEvent: (event: OpenAIStreamingEvent, threadId: string) => Promise<void>;
  
  // Run management
  setCurrentRunId: (runId: string | null) => void;
  processFormToolCall: (toolCallId: string, functionName: string, parameters: any, threadId: string, runId: string) => Promise<void>;
  
  // Utility functions
  toggleStreamEnabled: () => void;
  handleStreamError: (error: any) => void;
  
  // Tool handling
  handleToolCall: (toolData: any) => void;
  setCurrentMessageId: (messageId: string | null) => void;
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
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  max_prompt_tokens?: number | null;
  max_completion_tokens?: number | null;
  truncation_strategy?: string | null;
  response_format: any;
  tool_choice?: any;
  parallel_tool_calls?: boolean | null;
  additional_instructions?: string | null;
}
