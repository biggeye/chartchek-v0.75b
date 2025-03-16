// types/store/stream.ts

import { OpenAIStreamingEvent } from '@/types/api/openai';

// Main Zustand store interface
export interface StreamingState {
  // Core store state
  isStreamingActive: boolean;
  currentStreamContent: string;
  streamError: string | null;
  currentRunId: string | null;
  abortController: AbortController | null;
  currentFormKey: string | null;
  currentMessageId: string | null;
  isFormProcessing: boolean;
  formData: Record<string, any>;
  userId: string | null;
  toolCallsInProgress: any[];
  pdfPreviewUrl: string | null;

  // Core actions
  setIsStreamingActive: (active: boolean) => void;
  cancelStream: (threadId?: string, runId?: string) => Promise<boolean>;
  resetStream: () => void;
  setStreamContent: (content: string) => void;
  appendStreamContent: (content: string) => void;
  finalizeMessage: () => void;
  endStream: (savedMessageId?: string) => void;
  setStreamError: (error: string | null) => void;
  initialize: () => Promise<void>;
  updateStreamContent: (content: string) => void;
  processStreamEvent: (event: OpenAIStreamingEvent | any, threadId: string) => Promise<void>;
  setCurrentRunId: (runId: string | null) => void;
  toggleStreamEnabled: () => void;
  handleStreamError: (error: any) => void;
  setCurrentMessageId: (messageId: string | null) => void;
  startStream: (threadId: string, assistantId: string, additionalInstructions?: string) => Promise<void>;

  // Tool & PDF generation
  handleToolCall: (toolCall: any) => void;
  generatePDF: (patientData: Record<string, any>) => Promise<void>;
  setPdfPreviewUrl: (url: string | null) => void;
}

// An example interface representing an SSE message from the OpenAI stream
export interface StreamMessage {
  type: string;
  data: any;
}

// Example for partial deltas that may arrive from the SSE
export interface StreamDelta {
  delta: {
    content?: Array<{
      text: { value: string };
    }>;
  };
  snapshot?: any;
}

// For describing a run within a thread (database model or similar)
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
