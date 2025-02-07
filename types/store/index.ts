import { User } from '@supabase/supabase-js'
import { Assistant, Message, Run, Thread } from '../api/openai'
import { UserAssistant, ChatThread, Document } from '../database'

// Base State Interface
export interface AssistantState {
  user: User | null
  currentThread: ChatThread | null
  currentAssistant: UserAssistant | null
  messages: Message[]
  runs: Run[]
  userThreads: ChatThread[]
  userFiles: Document[]
  assistants: UserAssistant[]
}

// UI State Interface
export interface UIState {
  isLoading: boolean
  error: string | null
}

// Store Actions Interface
export interface StoreActions {
  setUser: (user: AssistantState['user']) => void
  setCurrentThread: (thread: AssistantState['currentThread']) => void
  setCurrentAssistant: (assistant: AssistantState['currentAssistant']) => void
  setMessages: (messages: AssistantState['messages']) => void
  addMessage: (message: Message) => void
  setRuns: (runs: AssistantState['runs']) => void
  addRun: (run: Run) => void
  setUserThreads: (threads: AssistantState['userThreads']) => void
  setUserFiles: (files: AssistantState['userFiles']) => void
  setAssistants: (assistants: AssistantState['assistants']) => void
}

// Async Actions Interface
export interface AsyncActions {
  fetchAssistants: () => Promise<void>
  fetchThreads: () => Promise<void>
  createThread: (assistantId?: string) => Promise<string | null>
  fetchThreadMessages: () => Promise<void>
}

// UI Actions Interface
export interface UIActions {
  setError: (error: string | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

// Complete Store Type
export type AssistantStore = AssistantState & UIState & StoreActions & AsyncActions & UIActions
