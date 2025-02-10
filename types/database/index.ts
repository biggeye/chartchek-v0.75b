import { Tool } from '../api/openai'
import { ToolResources } from '@/types/api/openai/tools'
import { ChatMessageAnnotation, MessageRole, MessageContent } from '@/types/api/openai/messages'

// Shared Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Database Types
export interface UserAssistant {
  id: string
  created_at?: string
  updated_at?: string
  user_id?: string
  assistant_id?: string
  name?: string
  description?: string
  instructions?: string
  model: string
  tools?: Tool[]
  tool_resources?: ToolResources
  metadata?: Record<string, any>
  is_active?: boolean
}

export interface ChatMessage {
  id: string
  content: MessageContent
  created_at: string
  updated_at?: string
  role: MessageRole
  message_id: string
  user_id: string
  thread_id: string
  attachments: string[]
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
  assistant_id?: string
  embedding_status?: ProcessingStatus
}


