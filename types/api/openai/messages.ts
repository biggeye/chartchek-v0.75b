import { FileAttachment } from './tools'

export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'in_progress' | 'completed' | 'incomplete'

export interface TextContent {
  value: string
  annotations: any[] 
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
}
