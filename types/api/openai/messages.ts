export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'in_progress' | 'completed' | 'incomplete'
import { ChatMessageAnnotation } from "@/types/store";
// OpenAI Tool Types
export interface Match {
  snippet: string;
  start: number;
  end: number;
}

interface FileAnnotation {
  fileId: string;
  matches: Match[];
  score?: number; // Optional score field
  id?: number; // Optional id for supertext reference
  type?: 'supertext' | 'link'; // Added type field
}


interface TextContent {
  value: string
  annotations?: ChatMessageAnnotation[]
}

export interface MessageContent {
  type: 'text';
  text: {
    value: string;
    annotations?: ChatMessageAnnotation[];
  };
}

interface FileAttachment {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface OpenAIMessage  {
  id?: string
  object?: 'thread.message'
  thread_id: string
  role: string
  content: MessageContent
  status?: MessageStatus
  assistant_id?: string
  run_id?: string
  created_at?: number
  metadata?: Record<string, any> | null
  attachments?: FileAttachment[]
  annotations?: FileAnnotation[]
}
