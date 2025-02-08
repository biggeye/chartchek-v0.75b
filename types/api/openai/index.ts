import { Tool, ToolResources } from './tools'

export * from './assistants'
export * from './messages'
export * from './tools'
export * from './runs'

// Base types for OpenAI objects
export interface Assistant {
  id: string
  object: 'assistant'
  name: string | null
  description: string | null
  model: string
  instructions: string | null
  tools: Tool[]
  attachments?: string[]
  tool_resources?: ToolResources
  metadata?: Record<string, any> | null
}
