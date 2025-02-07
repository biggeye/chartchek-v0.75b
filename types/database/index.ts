import { Tool } from '../api/openai'

// Shared Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type MessageRole = 'user' | 'assistant'

// Database Types
export interface UserAssistant {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  assistant_id: string
  name: string
  description?: string
  instructions?: string
  model: string
  tools?: Tool[]
  file_ids?: string[]
  vector_store_id?: string[]
  metadata?: Record<string, any>
  is_active: boolean
}

export interface ChatMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  role: MessageRole
  message_id: string
  user_id: string
  thread_id: string
  file_ids: string[]
  metadata?: Record<string, any>
}

export interface ChatThread {
  id: string
  user_id: string
  thread_id: string
  assistant_id?: string
  status?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  title?: string
  last_message_at?: string
  is_active: boolean
}

export interface Document {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  filename: string
  file_type?: string
  facility?: string
  category?: string
  file_id: string
  size_bytes?: number
  vector_store_id?: string
  processing_status: ProcessingStatus
  storage_path?: string
  mime_type?: string
  metadata?: Record<string, any>
  purpose?: 'assistants' | 'messages'
  assistant_id?: string
  embedding_status?: ProcessingStatus
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
}
