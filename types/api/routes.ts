import type { Assistant, Run, Tool, MessageRole, FileAttachment, ToolResources } from '@/types/api/openai'
import type { UserAssistant, ChatThread, ChatMessage, Document } from '../database'
import { ChatMessageAnnotation } from '../database'

// Assistant Routes
export interface AssistantCreateRequest {
  name?: string
  instructions?: string
  tools?: Tool[]
  model: string
  description?: string
  metadata?: Record<string, any>
  tool_resources?: string[]
}

export interface AssistantCreateResponse {
  assistant: Assistant
  userAssistant: UserAssistant
}

export interface AssistantUpdateRequest {
  assistant_id: string
  tool_resources?: ToolResources[]
  tools?: Tool[]
  name?: string
  description?: string
  instructions?: string
  model?: string
  metadata?: Record<string, any>
  is_active?: boolean
  vector_store_id?: string;
}

export interface AssistantUpdateResponse {
  success: boolean
  assistant?: UserAssistant
  error?: string
}

// Thread Routes
export interface ThreadCreateRequest {
  user_id: string
  assistant_id?: string
  title?: string
  metadata?: Record<string, any>
  initial_message?: string
}

export interface ThreadCreateResponse {
  thread: ChatThread
  message?: ChatMessage
}

export interface ThreadListResponse {
  threads: ChatThread[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface ThreadMessageRequest {
  user_id: string
  thread_id: string
  content: string
  role: MessageRole
  attachments?: FileAttachment[]
  metadata?: Record<string, any>
  annotations?: ChatMessageAnnotation[]
}

export interface ThreadMessageResponse {
  message: ChatMessage
}

export interface ThreadMessageAttachmentRequest {
  thread_id: string
  file_id: string
  message_id: string
}

export interface ThreadMessageAttachmentResponse {
  success: boolean
  document?: Document
  error?: string
}

// File Routes
export interface FileUploadRequest {
  file: File
  thread_id?: string
  assistant_id?: string
  purpose: 'assistants' | 'messages'
  metadata?: Record<string, any>
}

export interface FileUploadResponse {
  document: Document
}

// Run Routes
export interface RunCreateRequest {
  thread_id: string
  assistant_id: string
  metadata?: Record<string, any>
}

export interface RunCreateResponse {
  run: Run
}

export interface RunListRequest {
  thread_id: string
  limit?: number
  order?: 'asc' | 'desc'
  after?: string
  before?: string
}

export interface RunListResponse {
  object: string
  data: Run[]
}

export interface RunRetrieveRequest {
  thread_id: string
  run_id: string
}

export interface RunRetrieveResponse {
  run: Run
}

export interface ToolOutput {
  tool_call_id: string
  output: string
}

export interface RunSubmitToolOutputsRequest {
  thread_id: string
  run_id: string
  tool_outputs: ToolOutput[]
  stream?: boolean
}

export interface RunSubmitToolOutputsResponse {
  run: Run
}

export interface RunCancelRequest {
  thread_id: string
  run_id: string
}

export interface RunCancelResponse {
  run: Run
}

export interface RunStreamEvent {
  type: 'thread.message.created' | 'thread.message.delta' | 'thread.message.completed'
  data: {
    id?: string
    thread_id: string
    role?: 'assistant'
    content?: {
      type: 'text'
      text: string
    }[]
    status?: 'completed' | 'in_progress'
    metadata?: Record<string, any>
  }
}

// API Response Types
export interface ApiError {
  error: string
  status?: number
  code?: string
}

export type ApiResponse<T> = T | ApiError

// API Route Types
export interface ApiRoute<TReq, TRes> {
  request: TReq
  response: ApiResponse<TRes>
}

// Define all API routes
export interface ApiRoutes {
  '/api/assistant/create': ApiRoute<AssistantCreateRequest, AssistantCreateResponse>
  '/api/assistant/update': ApiRoute<AssistantUpdateRequest, AssistantUpdateResponse>
  '/api/thread/create': ApiRoute<ThreadCreateRequest, ThreadCreateResponse>
  '/api/thread/list': ApiRoute<void, ThreadListResponse>
  '/api/thread/message': ApiRoute<ThreadMessageRequest, ThreadMessageResponse>
  '/api/thread/message/attachment': ApiRoute<ThreadMessageAttachmentRequest, ThreadMessageAttachmentResponse>
  '/api/file/upload': ApiRoute<FileUploadRequest, FileUploadResponse>
  '/api/thread/run/create': ApiRoute<RunCreateRequest, RunCreateResponse>
  '/api/thread/run/list': ApiRoute<RunListRequest, RunListResponse>
  '/api/thread/run/retrieve': ApiRoute<RunRetrieveRequest, RunRetrieveResponse>
  '/api/thread/run/submit-tool-outputs': ApiRoute<RunSubmitToolOutputsRequest, RunSubmitToolOutputsResponse>
  '/api/thread/run/cancel': ApiRoute<RunCancelRequest, RunCancelResponse>
  '/api/thread/run/stream': ApiRoute<RunCreateRequest, RunStreamEvent>
}
