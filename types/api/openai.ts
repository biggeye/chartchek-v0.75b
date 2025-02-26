// /types/api/openai.ts

export interface OpenAIFile {
    id: string;
    object: string;
    bytes: number;
    created_at: number;
    filename: string;
    purpose: string;
  }
  
  export interface OpenAIThread {
    id: string;
    object: string;
    created_at: number;
    messages: OpenAIMessage[];
    tool_resources?: {
      file_search?: {
        vector_store_ids?: string[];
      };
    };
  }
  
  export interface OpenAIMessage {
    id: string;
    object: string;
    created_at: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: OpenAIAttachment[];
  }
  
  export interface OpenAIAttachment {
    file_id: string;
    tools?: OpenAITool[];
  }
  
  export interface OpenAITool {
    type: string; // Example: "file_search"
  }
  
  export interface OpenAIStreamingEvent {
    type: 'textDelta' | 'toolCall' | 'end' | 'error';
    data: any;
  }
  
  export interface OpenAIStreamingResponse {
    onTextDelta: (delta: string) => void;
    onToolCall?: (toolData: any) => void;
    onEnd: () => void;
    onError?: (error: any) => void;
  }

// Added types to replace old_openai imports
export interface Tool {
  type: 'code_interpreter' | 'file_search' | 'function';
}

// Modified Assistant interface to match application needs
export interface Assistant {
  id: string;
  object: string;
  created_at?: number;
  name: string | null;
  description: string | null;
  instructions: string | null;
  tools: Tool[];
  model: string;
  file_ids?: string[];
  metadata?: Record<string, any> | null;
  tool_resources?: ToolResources;
  vector_store_id?: string[];
}

export interface Run {
  id: string;
  created_at: number;
  assistant_id: string;
  thread_id: string;
  status: string;
  started_at?: number;
  completed_at?: number;
  last_error?: any;
  model: string;
  instructions?: string;
  tools: Tool[];
  file_ids: string[];
  metadata?: Record<string, any>;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface FileAttachment {
  file_id: string;
}

export interface ToolResources {
  code_interpreter?: {
    file_ids: string[];
  };
  file_search?: {
    vector_store_ids: string[];
  };
}