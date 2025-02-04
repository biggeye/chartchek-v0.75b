import { User } from '@supabase/supabase-js'

// OpenAI Tool Types
export interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface FunctionTool {
  type: 'function'
  function: FunctionDefinition
}

export interface CodeInterpreterTool {
  type: 'code_interpreter'
}

export interface FileSearchTool {
  type: 'file_search'
}

export type Tool = FunctionTool | CodeInterpreterTool | FileSearchTool

// Base types for OpenAI objects
export interface Assistant {
  id: string
  object: 'assistant'
  name: string | null
  description: string | null
  model: string
  instructions: string | null
  tools: Tool[]
  metadata?: Record<string, any> | null
}

export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'in_progress' | 'completed' | 'incomplete'

export type MessageContent = {
  type: 'text'
  text: string
}

export interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: MessageContent[]
  status?: MessageStatus
  file_ids: string[]
  created_at: number
  assistant_id?: string
  metadata?: Record<string, any> | null
}

export interface Thread {
  id: string
  object: 'thread'
  created_at: number
  metadata?: Record<string, any> | null
  userId: string // Link to Supabase user
  user_id: string
  assistant_id: string
  status?: string
  updated_at?: string
}

export interface Run {
  id: string
  object: 'run'
  thread_id: string
  assistant_id: string
  status: RunStatus
  created_at: number
  started_at?: number | null
  completed_at?: number | null
  last_error?: string | null
  metadata?: Record<string, any> | null
}

export interface RunStep {
  id: string
  object: 'run.step'
  run_id: string
  type: 'message_creation' | 'tool_calls'
  status: RunStatus
  created_at: number
  completed_at?: number | null
  metadata?: Record<string, any> | null
}

export type RunStatus = 
  | 'queued' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'expired'
  | 'cancelling'
  | 'requires_action'

// Supabase Database Types
export interface UserThread {
  id: string
  user_id: string
  thread_id: string
  assistant_id: string
  title: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface UserFile {
  id: string
  user_id: string
  file_id: string
  filename: string
  purpose: 'assistants' | 'messages'
  bytes: number
  created_at: string
}

// Zustand Store State Interface
export interface AssistantState {
  user: User | null
  currentThread: Thread | null
  currentAssistant: Assistant | null
  messages: Message[]
  runs: Run[]
  userThreads: UserThread[]
  userFiles: UserFile[]
  assistants: Assistant[]
}
