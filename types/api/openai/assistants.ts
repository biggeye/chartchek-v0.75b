import { Tool, ToolResources } from './tools'

export interface Assistant {
  id: string
  object: 'assistant'
  created_at: number
  name: string | null
  description: string | null
  model: string
  instructions: string | null
  tools: Tool[]
  tool_resources: ToolResources
  metadata?: Record<string, any>
}

export interface Thread {
  id: string
  object: 'thread'
  created_at: number
  metadata?: Record<string, any> | null
  tools?: Tool[]
  tool_resources?: ToolResources
  userId: string // Link to Supabase user
  user_id: string
  assistant_id: string
  status?: string
  updated_at?: string
}

