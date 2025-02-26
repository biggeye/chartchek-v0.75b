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

export interface ChatStoreState {
  // --- CORE STATE ---
  currentThread: Thread | null;
  historicalThreads: Thread[];
  transientFileQueue: Document[];
  isLoading: boolean;
  error: string | null;

  // --- THREAD MANAGEMENT ---
  createThread: () => Promise<string>;
  fetchHistoricalThreads: () => Promise<Thread[]>;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<void>;
  setCurrentThread: (thread: Thread | null) => void;

  // --- MESSAGE MANAGEMENT ---
  sendMessage: (assistantId: string,threadId: string, content: string, attachments?: ChatMessageAttachment[]) => Promise<void>;
  fetchCurrentMessages: (threadId: string) => Promise<ChatMessage[]>;
  addAssistantMessage: (content: any) => Promise<string>;
  setCurrentMessages: (messages: ChatMessage[]) => void;
  addAssistantIdToThread?: (assistantId: string, threadId: string) => Promise<void>;

  // --- FILE / DOCUMENT MANAGEMENT ---
  addFileToQueue: (doc: Document) => void;
  removeFileFromQueue: (doc: Document) => void;
  clearFileQueue: () => void;
  fetchFileNames: (vectorStoreId: string) => Promise<string[]>;

  // --- USER / ERROR MANAGEMENT ---
  setCurrentAssistantId: (assistantId: string) => void;
  setError: (error: string | null) => void;

  // --- REALTIME SUBSCRIPTIONS (OPTIONAL) ---
  subscribeToRealtimeMessages?: (threadId: string) => () => void;
}
