import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";
import type {
  ClientStoreType,
  Message,
  Thread,
  ChatMessageAnnotation
} from '@/types/store';

export const useClientStore = create<ClientStoreType>((set, get) => ({
  // Initial state
  userId: null,
  userAssistants: [],
  userThreads: [],
  currentThreadId: '',
  currentAssistantId: '',
  currentMessage: null,
  currentConversation: [],
  currentFileQueue: null,
  isLoading: false,
  error: null,

  // Actions
  setCurrentThreadId: (threadId: string) => {
    console.log('[ClientStore] Setting Current Thread ID:', threadId);
    set({ currentThreadId: threadId })
  },
  setCurrentConversation: (messages: Message[]) => set({ currentConversation: messages }),
  setCurrentAssistantId: (assistantId: string) => set({ currentAssistantId: assistantId }),
  setCurrentMessage: (message: string | null) => set({ currentMessage: message }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  reset: () => set({
    userId: null,
    userAssistants: [],
    userThreads: [],
    currentThreadId: '',
    currentAssistantId: '',
    currentMessage: null,
    currentConversation: [],
    currentFileQueue: null,
    isLoading: false,
    error: null
  }),

  // Async Actions
  createThread: async (assistantId?: string): Promise<string | null> => {
    console.log('[ClientStore] Creating thread for Assistant ID:', assistantId);
    set({ isLoading: true, error: null });
    try {
      const newThreadId = await createThreadInAPI(assistantId);
      if (newThreadId) {
        set({ currentThreadId: newThreadId });
      }
      return newThreadId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchUserId: async (): Promise<string | null> => {
    console.log('[ClientStore] Fetching user ID');
    try {
      const userId = await fetchUserIdFromSupabase();
      set({ userId });
      return userId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  },
  fetchUserAssistants: async (): Promise<string[]> => {
    console.log('[ClientStore] Fetching user assistants');
    try {
      const userAssistants = await fetchUserAssistantsFromSupabase(get().userId);
      set({ userAssistants });
      return userAssistants;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  },
  fetchUserThreads: async (assistantId: string): Promise<Thread[]> => {
    console.log('[ClientStore] Fetching threads for Assistant ID:', assistantId);
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ userThreads: data });
      return data; // Return the fetched threads
    } catch (err) {
      set({ error: (err as Error).message });
      return []; // Return an empty array in case of error
    } finally {
      set({ isLoading: false });
    }
  },
  fetchThreadMessages: async (threadId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId);

      if (error) {
        throw error;
      }

      // Ensure annotations are arrays and content.type is 'text'
      const messages = data.map((msg) => {
        return {
          id: msg.message_id,
          created_at: new Date(msg.created_at).getTime(),
          thread_id: msg.thread_id,
          role: msg.role,
          content: {
            type: 'text' as const,
            text: {
              value: msg.content.text.value,
              annotations: Array.isArray(msg.content.text.annotations)
                ? msg.content.text.annotations.map((ann: ChatMessageAnnotation, index: number) => ({
                  text: ann.text,
                  type: ann.type,
                  ...(ann.file_id && { file_id: ann.file_id }),
                  ...(ann.quote && { quote: ann.quote }),
                  start_index: ann.start_index,
                  end_index: ann.end_index
                })) : []
            }
          }
        };
      });

      return messages;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Message fetch failed';
      set({ error: errorMsg });
      console.error('[Store] Message Fetch Error:', errorMsg);
      return [];
    }
  },
  setThreadTitle: (title: string) => {
    const threadId = get().currentThreadId;
    console.log('[ClientStore] Setting title for Thread ID:', threadId);
    supabase
      .from('chat_threads')
      .upsert({ title: title })
      .eq('thread_id', threadId)
      .then(({ error }) => {
        if (error) {
          set({ error: error.message });
        }
      });
  },
  setUserThreads: (threads: Thread[]) => {
    set({ userThreads: threads });
  },
  deleteThread: async (threadId: string): Promise<void> => {
    console.log('[ClientStore] Deleting Thread ID:', threadId);
    try {
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('thread_id', threadId);
      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },
}))

const supabase = createClient();

// Helper functions for async operations
async function fetchUserIdFromSupabase(): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('id').single();
  if (error) {
    throw new Error(error.message);
  }
  return data?.id || null;
}
async function fetchUserAssistantsFromSupabase(userId: string | null): Promise<string[]> {
  const { data, error } = await supabase.from('assistants').select('id').eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map(row => row.id) || [];
}
async function createThreadInAPI(assistantId?: string): Promise<string | null> {
  const newThread = await fetch('/api/thread/create', {
    method: 'POST',
    body: assistantId ? JSON.stringify({ assistantId }) : undefined
  });
  const newThreadId = await newThread.json();
  if (newThreadId.error) {
    throw new Error(newThreadId.error);
  }
  return newThreadId;
}