import { Tool } from '../api/openai'
import { ToolResources } from '@/types/api/openai/tools'
import { MessageRole } from '@/types/api/openai/messages'
import { ChatMessageAnnotation } from '../store/client'
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

export interface TextContent {
  value: string
  annotations?: ChatMessageAnnotation[]
}

export interface MessageContent {
  type: 'text',
  text: TextContent
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
  id: string;
  createdAt: string;
  updatedAt: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  userId: string;
  processingStatus: ProcessingStatus;
}

// Removed duplicate ChatMessageAnnotation interface
