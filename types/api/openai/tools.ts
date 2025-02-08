// OpenAI Tool Types
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

// OpenAI Tool Resources
export interface ToolResources {
  file_search: {
    vector_store_ids: string[]
  }
  code_interpreter: {
    attachments: string[]
  }
}

export interface MessageContent {
  type: 'text'
  text: {
    value: string
    annotations: ChatMessageAnnotation[]
  }
}
// Message Attachment Types
export interface MessageFileAttachment {
  type: 'file'
  file_id: string
}

// File Attachment Types
export interface FileAttachment {
  file_id: string
  tools: Tool[]
}
