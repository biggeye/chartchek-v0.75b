// /types/store/streaming.ts

import { OpenAIStreamingEvent } from '@/types/api/openai';

export interface StreamingState {
  isStreamingActive: boolean;
  currentStreamContent: string;
  streamError: string | null;
  startStream: () => void;
  appendStream: (delta: string) => void;
  cancelStream: () => void;
  endStream: () => void;
  setStreamError: (error: string) => void;
  handleToolCall: (toolData: OpenAIStreamingEvent) => void;
}
