// Base types
export * from './api/openai'

// API types
export * from './api/routes'

// Re-export commonly used types for convenience
export type {
  UserAssistant,
  ChatThread,
  ChatMessage,
  Document,
} from './database'

export type {
  AssistantCreateRequest,
  AssistantCreateResponse,
  ThreadCreateRequest,
  ThreadCreateResponse,
  ThreadMessageRequest,
  ThreadMessageResponse,
  ApiResponse,
  ApiError
} from './api/routes'

// Type groupings
import * as OpenAITypes from './api/openai'
import * as RouteTypes from './api/routes'
import * as DatabaseTypes from './database'
import * as StoreTypes from './store/index'

export const API = {
  OpenAI: OpenAITypes,
  Routes: RouteTypes
}

export const Database = DatabaseTypes
export const Store = StoreTypes
