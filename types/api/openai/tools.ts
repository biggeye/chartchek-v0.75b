

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
