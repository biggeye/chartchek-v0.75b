import { FileAttachment } from './tools'

export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'in_progress' | 'completed' | 'incomplete'

// OpenAI Tool Types
export interface Match {
  snippet: string;
  start: number;
  end: number;
}

export interface FileAnnotation {
  fileId: string;
  matches: Match[];
  score?: number; // Optional score field
  id?: number; // Optional id for supertext reference
  type?: 'supertext' | 'link'; // Added type field
}

export interface ChatMessageAnnotation {
  id: string
  message_id: string
  type: string
  text: string
  file_id?: string
  quote?: string
  start_index?: number
  end_index?: number
  created_at: string
  annotations?: FileAnnotation[]
}

export interface TextContent {
  value: string
  annotations: ChatMessageAnnotation[]
}

export interface MessageContent {
  type: 'text'
  text: TextContent
}

export interface Message {
  id?: string
  object?: 'thread.message'
  thread_id: string
  role: MessageRole
  content: MessageContent[]
  status?: MessageStatus
  assistant_id?: string
  run_id?: string
  created_at: number
  metadata?: Record<string, any> | null
  attachments?: FileAttachment[]
  annotations?: FileAnnotation[]
}
