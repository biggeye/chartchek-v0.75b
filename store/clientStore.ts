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
  currentThreadTitle: '',
  currentAssistantId: '',
  currentMessage: null,
  currentConversation: [],
  currentFileQueue: null,
  isLoading: false,
  error: null,

  // Actions
  setCurrentThreadId: (threadId: string) => {
    set({ currentThreadId: threadId })
  },
  setCurrentThreadTitle: (title: string) => set({ currentThreadTitle: title }),
  setCurrentConversation: (messages: Message[]) => set({ currentConversation: messages }),
  setCurrentAssistantId: (assistantId: string) => set({ currentAssistantId: assistantId }),
  setCurrentMessage: (message: string | null) => set({ currentMessage: message }),
  setUserThreads: (threads: Thread[]) => set({ userThreads: threads }),
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
    set({ isLoading: true, error: null });
    try {
      const newThreadId = await createThreadInAPI(assistantId);
      if (newThreadId) {
        set({ currentThreadId: newThreadId });
        get().fetchThreadMessages(newThreadId);
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
      const threadTitle = await supabase.from('chat_threads').select('title').eq('thread_id', threadId).single();
      set({ currentThreadTitle: threadTitle?.data?.title });
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
      return [];
    }
  },
  setThreadTitle: (thread_id: string, title: string) => {
    const assistantId = get().currentAssistantId;
    console.log(`Attempting to update thread with ID: ${thread_id} to new title: ${title}`);
    supabase
      .from('chat_threads')
      .update({ title: title })
      .eq('thread_id', thread_id)
      .then(({ error }) => {
        if (error) {
          console.error(`Error updating thread title: ${error.message}`);
          set({ error: error.message });
        } else {
          console.log(`Successfully updated thread title to: ${title}`);
        }
      });
      get().fetchUserThreads(assistantId);
  },
  deleteThread: async (threadId: string): Promise<void> => {
    const assistantId = get().currentAssistantId;
    try {
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('thread_id', threadId);
      if (error) throw error;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
    get().fetchUserThreads(assistantId);
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