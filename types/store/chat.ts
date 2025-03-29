import { Document } from './document';
import { ChatMessage, ChatMessageAttachment, ToolResources } from '../database';
import { ThreadMessage } from '../api/openai';

export interface Thread {
  id?: string;
  thread_id: string;
  created_at?: string;
  last_message_at?: string;
  deleted_at?: string | null;
  name?: string;
  user_id?: string;
  assistant_id?: string;
  metadata?: any;
  messages?: ThreadMessage[];
  current_files?: Document[];
  title?: string;
  tool_resources: ToolResources | null;
  // Pagination support
  has_more?: boolean;
  next_page?: string;
}

export interface UserChatMessage {
  id?: string;
  role: 'user';
  content: string;
  attachments?: ChatMessageAttachment[];
}

/**
 * Response object for checking the status of a run
 */
export interface RunStatusResponse {
  isActive: boolean;
  status?: string;
  requiresAction?: boolean;
  requiredAction?: {
    type: string;
    toolCalls?: any[];
  };
  runId?: string;
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
  messageId?: string;
  threadId?: string;
}

export interface PatientContext {
  patientId: string | null;
  patientName: string | null;
  facilityId?: string | null;
}

export interface ChatContext {
  facilityId: number | null;
  patientId: string | null;
  patientName: string | null;
}


export interface ChatStoreState {
  // --- CORE STATE ---
  currentAssistantId: string | null;
  currentThread: Thread | null;
  historicalThreads: Thread[];
  transientFileQueue: Document[];
  patientContext: PatientContext | null;
  chatContext: ChatContext | null;
  activeRunStatus: RunStatusResponse | null;
  isLoading: boolean;
  // In store/chatStore.ts
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;

  // --- ASSISTANT MANAGEMENT ---
  setCurrentAssistantId: (assistantId: string) => void;

  // --- THREAD MANAGEMENT ---
  createThread: (assistantId: string) => Promise<string>;
  setCurrentThread: (thread: Thread | null) => void;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<any>;
  // --- HISTORICAL THREADS ---
  fetchHistoricalThreads: () => Promise<Thread[]>;

  // --- MESSAGE MANAGEMENT ---
  sendMessage: (
    assistantId: string,
    threadId: string,
    content: string,
    attachments?: any[] | [],
  ) => Promise<SendMessageResult>;
  
  // --- MESSAGE FETCHING ---
  fetchOpenAIMessages: (threadId: string) => Promise<any[] | undefined>;

  // --- RUN MANAGEMENT ---
  checkActiveRun: (threadId: string) => Promise<RunStatusResponse>;

  // --- ERROR HANDLING ---
  setError: (error: string | null) => void;
  clearError: () => void;
}