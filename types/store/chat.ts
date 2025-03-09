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
}

export interface ChatStoreState {
  // --- CORE STATE ---
  currentThread: Thread | null;
  historicalThreads: Thread[];
  transientFileQueue: Document[];
  isLoading: boolean;
  error: string | null;
  activeRunStatus: RunStatusResponse | null;
  currentAssistantId: string | null;

  // --- THREAD MANAGEMENT ---
  createThread: (assistantId: string) => Promise<string>;
  fetchHistoricalThreads: () => Promise<Thread[]>;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<void>;
  setCurrentThread: (thread: Thread | null) => void;

  // --- MESSAGE MANAGEMENT ---
  sendMessage: (assistantId: string, threadId: string, content: string, attachments?: ChatMessageAttachment[]) => Promise<SendMessageResult>;
  fetchOpenAIMessages: (threadId: string) => Promise<ThreadMessage[] | undefined>;
  addMessageReference: (messageId: string, threadId: string, role: string, content: string) => Promise<void>;
  setCurrentMessages: (messages: ThreadMessage[]) => void;

  // --- RUN MANAGEMENT ---
  checkActiveRun: (threadId: string) => Promise<RunStatusResponse>;
  updateActiveRunStatus: (status: RunStatusResponse | null) => void;
  getLatestRun: (threadId: string) => Promise<import('../api/openai').Run | null>;
  addStreamingMessage: (message: string) => void;
  // --- FILE / DOCUMENT MANAGEMENT ---
  addFileToQueue: (doc: Document) => void;
  removeFileFromQueue: (doc: Document) => void;
  clearFileQueue: () => void;

  // --- USER / ERROR MANAGEMENT ---
  setCurrentAssistantId: (assistantId: string) => void;
  setError: (error: string | null) => void;
}
