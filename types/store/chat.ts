import { Document } from './document';
import { ChatMessage, ChatMessageAttachment, ToolResources } from '../database';

export interface Thread {
  thread_id: string;
  assistant_id?: string;
  messages: ChatMessage[];
  current_files?: Document[];
  title?: string;
  tool_resources: ToolResources | null;  // this is an object or null
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
  runId?: string; // Add the runId for tool output submissions
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
}

export interface ChatStoreState {
  // --- CORE STATE ---
  currentThread: Thread | null;
  historicalThreads: Thread[];
  transientFileQueue: Document[];
  isLoading: boolean;
  error: string | null;
  activeRunStatus: RunStatusResponse | null;

  // --- THREAD MANAGEMENT ---
  createThread: () => Promise<string>;
  fetchHistoricalThreads: () => Promise<Thread[]>;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<void>;
  setCurrentThread: (thread: Thread | null) => void;

  // --- MESSAGE MANAGEMENT ---
  sendMessage: (assistantId: string,threadId: string, content: string, attachments?: ChatMessageAttachment[]) => Promise<SendMessageResult>;
  fetchCurrentMessages: (threadId: string) => Promise<ChatMessage[]>;
  addAssistantMessage: (content: any, messageId: string) => Promise<string>;
  setCurrentMessages: (messages: ChatMessage[]) => void;
  addAssistantIdToThread?: (assistantId: string, threadId: string) => Promise<void>;
  subscribeToRealtimeMessages: (threadId: string) => () => void;
  
  // --- RUN MANAGEMENT ---
  checkActiveRun: (threadId: string) => Promise<RunStatusResponse>;
  updateActiveRunStatus: (status: RunStatusResponse | null) => void;
  getLatestRun: (threadId: string) => Promise<import('../api/openai').Run | null>;
  
  // --- FILE / DOCUMENT MANAGEMENT ---
  addFileToQueue: (doc: Document) => void;
  removeFileFromQueue: (doc: Document) => void;
  clearFileQueue: () => void;
  fetchFileNames: (vectorStoreId: string) => Promise<string[]>;

  // --- USER / ERROR MANAGEMENT ---
  setCurrentAssistantId: (assistantId: string) => void;
  setError: (error: string | null) => void;
}
