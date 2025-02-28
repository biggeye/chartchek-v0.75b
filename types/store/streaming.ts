// /types/store/streaming.ts

import { OpenAIStreamingEvent } from '@/types/api/openai';

export interface StreamingState {
  isStreamingActive: boolean;
  currentStreamContent: string;
  streamError: string | null;
  currentFormKey: string | null;  // Added for form handling
  currentMessageId: string | null; // Added to store OpenAI message ID
  
  // Streaming operations
  startStream: () => void;
  appendStream: (delta: string) => void;
  cancelStream: () => void;
  endStream: () => void;
  setStreamError: (error: string) => void;
  handleToolCall: (toolData: OpenAIStreamingEvent) => void;
  
  // Form handling operations moved from chatStore
  setCurrentFormKey: (formKey: string | null) => void;
  processAssistantResponse: (response: any) => void;
  
  // Run management operations moved from chatStore
  cancelRun: (threadId: string, runId: string) => Promise<boolean>;
  storeRunData: (run: any) => Promise<any>;
  
  // Function submission operations moved from chatStore
  submitNewFunction: (params: any) => Promise<void>;
  submitEobSummary: (params: any) => Promise<void>;
  submitToolOutputs: (threadId: string, runId: string, toolOutputs: any[]) => Promise<boolean>;
  
  // New operation to set the message ID
  setCurrentMessageId: (id: string) => void;
}
