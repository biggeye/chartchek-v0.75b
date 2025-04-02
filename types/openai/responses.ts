// Base content types
export interface BaseContent {
    type: string;
    id?: string;
  }
  
  export interface TextContent extends BaseContent {
    type: 'text';
    text: string;
  }
  
  export interface OutputTextContent extends BaseContent {
    type: 'output_text';
    text: string;
    annotations?: Array<{
      type: string;
      text: string;
      [key: string]: any;
    }>;
  }
  
  export interface ImageContent extends BaseContent {
    type: 'image';
    image: {
      url: string;
      detail?: 'auto' | 'low' | 'high';
    };
  }
  
  export interface RefusalContent extends BaseContent {
    type: 'refusal';
    refusal: string;
  }
  
  // Base tool call interface
  export interface BaseToolCall extends BaseContent {
    id: string;
    status?: 'in_progress' | 'completed' | 'incomplete' | 'failed' | 'searching';
  }
  
  // Function tool calls
  export interface FunctionToolCall extends BaseToolCall {
    type: 'function_call';
    name: string;
    arguments: string; // JSON string
    call_id: string;
  }
  
  // File search tool calls
  export interface FileSearchToolCall extends BaseToolCall {
    type: 'file_search_call';
    queries: string[];
    results?: Array<{
      attributes: Record<string, string | boolean | number>;
      file_id: string;
      filename: string;
      score: number;
      text: string;
    }> | null;
  }
  
  // Web search tool calls
// Web search tool calls
export interface WebSearchToolCall extends BaseToolCall {
    type: 'web_search_call';
    status: 'in_progress' | 'completed' | 'incomplete' | 'failed' | 'searching';
  }
  
  // Computer tool calls
  export interface ComputerToolCall extends BaseToolCall {
    type: 'computer_call';
    actions?: Array<{
      type: string;
      [key: string]: any;
    }>;
  }
  
  // Reasoning output
  export interface ReasoningOutput extends BaseContent {
    id: string;
    type: 'reasoning';
    summary: Array<{
      text: string;
    }>;
    status?: 'in_progress' | 'completed' | 'incomplete';
  }
  
  // Message container
  export interface OutputMessage extends BaseContent {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<OutputTextContent | RefusalContent>;
    status?: 'in_progress' | 'completed' | 'incomplete';
  }
  
  // Tool definitions
  export interface BaseToolDefinition {
    type: string;
  }
  
  export interface FunctionToolDefinition extends BaseToolDefinition {
    type: 'function';
    name: string;
    description?: string;
    parameters: Record<string, any>; // JSON Schema
    strict?: boolean;
  }
  
  export interface FileSearchToolDefinition extends BaseToolDefinition {
    type: 'file_search';
    vector_store_ids?: string[];
    filters?: Record<string, any>;
    max_num_results?: number;
    ranking_options?: {
      semantic_similarity_threshold?: number;
    };
  }
  
  export interface WebSearchToolDefinition extends BaseToolDefinition {
    type: 'web_search_preview' | 'web_search_preview_2025_03_11';
    search_context_size?: 'low' | 'medium' | 'high';
    user_location?: {
      type: 'approximate';
      city: string;
      country: string;
      region: string;
      timezone: string;
    } | null;
  }
  
  export interface ComputerUseToolDefinition extends BaseToolDefinition {
    type: 'computer_use_preview';
    display_width: number;
    display_height: number;
    environment: string;
  }
  
  // Reasoning configuration
  export interface ReasoningConfig {
    effort?: 'low' | 'medium' | 'high' | null;
    generate_summary?: 'concise' | 'detailed' | null;
  }
  
  // Text format options
  export interface TextFormat {
    type: 'text';
  }
  
  export interface JSONSchemaFormat {
    type: 'json_schema';
    name: string;
    schema: Record<string, any>;
    description: string;
    strict?: boolean;
  }
  
  export interface JSONObjectFormat {
    type: 'json_object';
  }
  
  export type TextFormatOptions = TextFormat | JSONSchemaFormat | JSONObjectFormat;
  
  // Error interface
  export interface OpenAIError {
    code: string;
    message: string;
    param?: string;
    type?: string;
  }
  
  // Usage tracking
  export interface OpenAIUsage {
    input_tokens: number;
    input_tokens_details?: {
      cached_tokens: number;
    };
    output_tokens: number;
    output_tokens_details?: {
      reasoning_tokens: number;
    };
    total_tokens: number;
  }
  
  // Main response type
  export interface OpenAIResponse {
    id: string;
    object: string; // Always "response"
    created_at: number; // Unix timestamp in seconds
    model: string;
    instructions: string | null;
    
    // Response content
    output: Array<
      | OutputMessage
      | FileSearchToolCall
      | FunctionToolCall
      | WebSearchToolCall
      | ComputerToolCall
      | ReasoningOutput
    >;
    output_text?: string | null; // SDK-only convenience property
    
    // Status and error handling
    status: 'completed' | 'failed' | 'in_progress' | 'incomplete';
    error: OpenAIError | null;
    incomplete_details: {
      reason: string;
    } | null;
    
    // Configuration options
    temperature: number | null;
    top_p: number | null;
    max_output_tokens: number | null;
    truncation: 'auto' | 'disabled' | null;
    parallel_tool_calls: boolean;
    
    // Tools and reasoning
    tools: Array<
      | FileSearchToolDefinition
      | FunctionToolDefinition
      | ComputerUseToolDefinition
      | WebSearchToolDefinition
    >;
    tool_choice: 
      | 'none' 
      | 'auto' 
      | 'required'
      | { type: 'file_search' | 'web_search_preview' | 'computer_use_preview' }
      | { type: 'function', name: string };
    reasoning: ReasoningConfig | null;
    
    // Text configuration
    text: {
      format?: TextFormatOptions;
    };
    
    // Metadata and usage tracking
    metadata: Record<string, string>; // Max 16 key-value pairs
    usage: OpenAIUsage;
    
    // Conversation state
    previous_response_id: string | null;
    user: string;
  }
  
  // Streaming-specific types
  export interface OpenAIStreamEvent {
    type: 'response.created';
    response: OpenAIResponse;
  }
  
  // For compatibility with existing code that might use these types
  export type StreamOutputContent = 
    | TextContent
    | ImageContent
    | OutputTextContent
    | RefusalContent
    | FunctionToolCall
    | FileSearchToolCall
    | WebSearchToolCall
    | ComputerToolCall
    | ReasoningOutput;