// /types/store/streaming.ts

import { OpenAIStreamingEvent } from '@/types/api/openai';

export interface StreamingState {
  isStreamingActive: boolean;
  currentStreamContent: string;
  streamError: string | null;
  currentFormKey: string | null;  // Added for form handling
  currentMessageId: string | null; // Added to store OpenAI message ID
  currentRunId: string | null; // Added to store the current run ID
  isFormProcessing: boolean;
  formData: Record<string, any>;
  userId: string | null; // Add userId to the state
  
  // Streaming operations
  startStream: (threadId: string, assistantId: string) => Promise<void>;
  appendStream: (delta: string) => void;
  cancelStream: (threadId: string, runId: string) => Promise<boolean>;
  endStream: (savedMessageId?: string) => void;
  setStreamError: (error: string | null) => void;
  // In StreamingState interface
abortController: AbortController | null;
  // Initialization
  initialize: () => Promise<void>; // New initialization function
  
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
