export interface Thread {
  thread_id: string
  title: string
  updated_at: string
}

export interface Message {
  id: string;
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: {
      value: string;
      annotations: ChatMessageAnnotation[];
    };
  };
  [key: string]: any;
}

export interface ChatMessageAnnotation {
  id?: string;
  message_id?: string;
  type: 'file' | 'quote' | 'file_citation';
  text?: string;
  file_id?: string;
  quote?: string;
  start_index?: number;
  end_index?: number;
  created_at?: string;
  file_citation?: {
    file_id: string;
    quote?: string;
  };
}

// User Auth Interface
interface UserState {

  userId: string | null
  userThreads: Thread[]
  userAssistants: string[]
}
// Base State Interface
interface ChatState {
  currentThreadId: string
  currentThreadTitle: string
  currentAssistantId: string
  currentMessage: string | null
  currentConversation: Message[] | []
  currentFileQueue: string[] | null
}
// UI State Interface
interface UIState {
  isLoading: boolean
  error: string | null
}
// Async Actions Interface
interface AsyncActions {
  // create
  createThread: (assistantId?: string) => Promise<string | null>;  // Create a thread with assistantId and store response
  // read
  fetchUserId: () => Promise<UserState['userId']>;  // Fetch userId from Supabase auth provider
  fetchUserAssistants: () => Promise<UserState['userAssistants']>;  // Fetch assistants from PostgreSQL using userId
  fetchUserThreads: (assistantId: string) => Promise<Thread[]>;  // Fetch threads using assistantId
  fetchThreadMessages: (threadId: ChatState['currentThreadId']) => Promise<ChatState['currentConversation']>;  // Fetch messages using threadId
  // update
  setUserThreads: (userThreads: Thread[]) => void;
  setThreadTitle: (thread_id: string, title: string) => void;
  // delete
  deleteThread: (threadId: string) => Promise<void>;
}
// UI Actions Interface
interface UIActions {
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

// Client State Interface
interface ClientState extends UserState, ChatState, UIState {
  // State Actions
  setCurrentThreadId: (threadId: ChatState['currentThreadId']) => void;  // Set current thread ID
  setCurrentConversation: (messages: ChatState['currentConversation']) => void;  // Set current conversation
  setCurrentAssistantId: (currentAssistantId: ChatState['currentAssistantId']) => void;  // Set current assistant ID
  setCurrentMessage: (message: ChatState['currentMessage']) => void;  // Set current message
  setIsLoading: (isLoading: UIState['isLoading']) => void;
  setError: (error: UIState['error']) => void;

  // UI Actions
  reset: () => void
}
// Complete Store Type
export type ClientStoreType =
  UserState &
  ChatState &
  UIState &
  ClientState &
  AsyncActions &
  UIActions;
