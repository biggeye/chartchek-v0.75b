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
  
  // SSE event types from OpenAI Assistants API
  export interface OpenAIStreamingEvent {
    type: 'thread.created' | 
          'thread.run.created' | 
          'thread.run.queued' | 
          'thread.run.in_progress' | 
          'thread.run.requires_action' | 
          'thread.run.completed' | 
          'thread.run.incomplete' | 
          'thread.run.failed' | 
          'thread.run.cancelling' | 
          'thread.run.cancelled' | 
          'thread.run.expired' | 
          'thread.run.step.created' | 
          'thread.run.step.in_progress' | 
          'thread.run.step.delta' | 
          'thread.run.step.completed' | 
          'thread.run.step.failed' | 
          'thread.run.step.cancelled' | 
          'thread.run.step.expired' | 
          'thread.message.created' | 
          'thread.message.in_progress' | 
          'thread.message.delta' | 
          'thread.message.completed' | 
          'thread.message.incomplete' | 
          'error' | 
          'done' |
          // SDK event names used for convenience
          'textDelta' | 
          'textCreated' | 
          'messageCreated' | 
          'messageDelta' | 
          'toolCall' | 
          'toolCallCreated' | 
          'toolCallDelta' | 
          'stepCreated' | 
          'codeInput' | 
          'codeOutput' | 
          'event' | 
          'run' | 
          'end';
    data: any;
  }
  
  export interface OpenAIStreamingResponse {
    // SDK event handlers
    onTextDelta?: (textDelta: string) => void;
    onTextCreated?: (text: any) => void;
    onMessageCreated?: (message: any) => void;
    onMessageDelta?: (delta: any, snapshot: any) => void;
    onToolCall?: (toolCall: any) => void;
    onToolCallCreated?: (toolCall: any) => void;
    onToolCallDelta?: (toolCallDelta: any) => void;
    onEvent?: (event: any) => void;
    onRun?: (run: any) => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    
    // SSE event handlers
    onThreadCreated?: (thread: any) => void;
    onThreadRunCreated?: (run: any) => void;
    onThreadRunQueued?: (run: any) => void;
    onThreadRunInProgress?: (run: any) => void;
    onThreadRunRequiresAction?: (run: any) => void;
    onThreadRunCompleted?: (run: any) => void;
    onThreadRunIncomplete?: (run: any) => void;
    onThreadRunFailed?: (run: any) => void;
    onThreadRunCancelling?: (run: any) => void;
    onThreadRunCancelled?: (run: any) => void;
    onThreadRunExpired?: (run: any) => void;
    onThreadRunStepCreated?: (step: any) => void;
    onThreadRunStepInProgress?: (step: any) => void;
    onThreadRunStepDelta?: (delta: any) => void;
    onThreadRunStepCompleted?: (step: any) => void;
    onThreadRunStepFailed?: (step: any) => void;
    onThreadRunStepCancelled?: (step: any) => void;
    onThreadRunStepExpired?: (step: any) => void;
    onThreadMessageCreated?: (message: any) => void;
    onThreadMessageInProgress?: (message: any) => void;
    onThreadMessageDelta?: (delta: any) => void;
    onThreadMessageCompleted?: (message: any) => void;
    onThreadMessageIncomplete?: (message: any) => void;
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
  additional_instructions?: string;
  tools: Tool[];
  file_ids: string[];
  metadata?: Record<string, any>;
  temperature?: number;
  top_p?: number;
  max_prompt_tokens?: number;
  max_completion_tokens?: number;
  truncation_strategy?: string;
  response_format?: any;
  tool_choice?: any;
  parallel_tool_calls?: boolean | null;
  required_action?: any;
  failed_at?: string;
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

export interface ThreadMessage {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  file_ids: string[];
  assistant_id: string | null;
  run_id: string | null;
  metadata: Record<string, any> | null;
}

export interface MessageContent {
  type: 'text' | 'image_file';
  text?: {
    value: string;
    annotations?: any[];
  };
  image_file?: {
    file_id: string;
  };
}