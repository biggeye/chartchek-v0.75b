'use client'

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";
import type {
  ClientStoreType,
  Message,
  Thread,
  ChatMessageAnnotation
} from '@/types/store';
import { isValidUUID } from '@/utils/validation';
// Add environment check utility
const isBrowser = typeof window !== 'undefined';

// Safe localStorage helper
const getPersistedThreadId = () => {
  try {
    return isBrowser ? localStorage.getItem(LOCAL_STORAGE_THREAD_ID_KEY) || '' : '';
  } catch (error) {
    console.error('LocalStorage access error:', error);
    return '';
  }
};
// Update store initialization
const LOCAL_STORAGE_THREAD_ID_KEY = 'currentThreadId';

const getInitialThreadId = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_THREAD_ID_KEY) || '';
};

export const useClientStore = create<ClientStoreType>((set, get) => ({
  // Initial state
  userId: null,
  userAssistants: [],
  userThreads: [],
  currentThreadId: getPersistedThreadId(),
  currentThreadTitle: '',
  currentAssistantId: '',
  currentMessage: null, // Ensure this line ends with a comma
  currentConversation: [], // Add missing comma
  currentFileQueue: null, // Add missing comma
  isLoading: false, // Add missing comma
  error: null, // Add missing comma

  // Actions
  setCurrentThreadId: (threadId: string) => {
    set({ currentThreadId: threadId });
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_THREAD_ID_KEY, threadId);
    }
},
  setCurrentThreadTitle: (title: string) => 
    set({ currentThreadTitle: title }),
  setCurrentConversation: (messages: Message[]) => 
    set({ currentConversation: messages }),
  setCurrentAssistantId: (assistantId: string) => 
    set({ currentAssistantId: assistantId }),
  setCurrentMessage: (message: string | null) => 
    set({ currentMessage: message }),
  setUserThreads: (threads: Thread[]) => 
    set({ userThreads: threads }),
  setIsLoading: (isLoading: boolean) => 
    set({ isLoading }),
  setError: (error: string | null) => 
    set({ error }),
  setLoading: (isLoading: boolean) => 
    set({ isLoading }),
  reset: () => 
    set({
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
  fetchUserId: async (): Promise<string> => {
    try {
      const userId = await fetchUserIdFromSupabase();
      set({ userId });
      return userId;
    } catch (error) {
      console.error('[Store: fetchUserId] Error:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
      return '';
    }
  },
  fetchUserAssistants: async (): Promise<string[]> => {
    const userId = get().userId;
    // Validate UUID before query
    if (!userId || !isValidUUID(userId)) {
      return [];
    }

    try {
      return await fetchUserAssistantsFromSupabase(userId);
    } catch (error) {
      console.error('[Store: fetchUserAssistants] Error:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  },
  createThread: async (assistantId: string): Promise<string | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assistant_id: assistantId }),
      });
      if (!response.ok) throw new Error('Failed to create thread');
      const responseData = await response.json();
      const newThreadId = responseData.threadId;
      const userId: any = await fetchUserIdFromSupabase();
      await addThreadToSupabase(newThreadId, assistantId, userId);
      set({ currentThreadId: newThreadId });
      return newThreadId;
    } catch (error) {
      console.error('[Store: createThread] Error:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchUserThreads: async (assistantId: string): Promise<Thread[]> => {
    set({ isLoading: true });
    try {
      const threads = await fetch(`/api/threads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!threads.ok) {
        throw new Error(`Failed to fetch messages: ${threads.statusText}`);
      }
      const threadsData = await threads.json();
      return threadsData;
    } catch (err) {
      console.error('[Store: fetchUserThreads] Error:', err);
      set({ error: (err as Error).message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  fetchThreadMessages: async (threadId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const json = await response.json();

      // Assuming json has a structure with a data array
      const messages = (json.data || []).map((msg: any) => {
        return {
          id: msg.id,
          created_at: new Date(msg.created_at * 1000).getTime(),
          thread_id: msg.thread_id,
          role: msg.role,
          content: (Array.isArray(msg.content) && msg.content.length > 0) ? {
            type: msg.content[0].type,
            text: {
              value: msg.content[0].text.value,
              annotations: Array.isArray(msg.content[0].text.annotations) ? msg.content[0].text.annotations : []
            }
          } : { type: 'text', text: { value: '', annotations: [] } }
        };
      });

      return messages;
    } catch (err) {
      console.error('[Store: fetchThreadMessages] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Message fetch failed';
      set({ error: errorMsg });
      return [];
    }
  },
  setThreadTitle: (thread_id: string, title: string) => {
    const assistantId = get().currentAssistantId;
    supabase
      .from('chat_threads')
      .update({ title: title })
      .eq('thread_id', thread_id)
      .then(({ error }) => {
        if (error) {
          console.error(`[Store: setThreadTitle] Error updating thread title: ${error.message}`);
          set({ error: (error as Error).message });
        } else {
        }
      });
    get().fetchUserThreads(assistantId);
  },
  deleteThread: async (threadId: string): Promise<void> => {
    const assistantId = get().currentAssistantId;
    try {
      const deletedThread = await fetch(`/api/threads/${threadId}/delete`, { method: 'DELETE' });
      if (deletedThread) {
        await deleteThreadFromSupabase(threadId);

        // Perform cleanup here
        const { currentThreadId } = get();
        if (currentThreadId === threadId) {
          set({ currentThreadId: '' });
          if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_STORAGE_THREAD_ID_KEY);
          }
        }
      }
    } catch (error) {
      console.error('[Store: deleteThread] Error:', error);
      set({ error: (error as Error).message });
    }
    get().fetchUserThreads(assistantId);
  },
  sendMessage: async (threadId: string, formData: FormData): Promise<Response> => {
    set({ isLoading: true, error: null });
    try {
      const userId: any = await fetchUserIdFromSupabase();
      const content = formData.get('content')as string;
      if (!content) {
        throw new Error('Content is required');
      }
        const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        console.error('[sendMessage] Failed to send message');
        throw new Error('Failed to send message');
      }
      return response;
    } catch (error) {
      console.error('[sendMessage] Error:', error);
      set({ error: (error as Error).message });
      throw error as Error;
    } finally {

      await updateThreadInSupabase(threadId);
      set({ isLoading: false });
    }
  },
  addAssistantMessageToThread: async (threadId: string, userId: string, content: string): Promise<string> => {
    try {
      if (!threadId || !userId || !content) {
        throw new Error('Invalid input parameters');
      }
      const data = await addAssistantMessageToSupabase(threadId, userId, content);
      if (!data) {
        console.error('[addAssistantMessageToThread] Error: No data returned', { threadId, userId, content });
        throw new Error('Failed to add message to Supabase');
      }
      return data;
    } catch (error) {
      console.error('[addAssistantMessageToThread] Exception:', error);
      throw error;
    }
  },
  // Vector Store Operations
  listVectorStores: async (): Promise<any[]> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/vector', { method: 'GET' });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Store: listVectorStores] Error:', error);
      set({ error: (error as Error).message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  retrieveVectorStore: async (vectorStoreId: string): Promise<any | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/vector/${vectorStoreId}`, { method: 'GET' });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Store: retrieveVectorStore] Error:', error);
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  modifyVectorStore: async (vectorStoreId: string, updates: any): Promise<any | null> => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/vector/${vectorStoreId}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Store: modifyVectorStore] Error:', error);
      set({ error: (error as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteVectorStore: async (vectorStoreId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/vector/${vectorStoreId}/delete`, { method: 'DELETE' });
    } catch (error) {
      console.error('[Store: deleteVectorStore] Error:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}))

const supabase = createClient();
// Helper functions for async operations
async function fetchUserIdFromSupabase(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[fetchUserIdFromSupabase] Error:', authError);
    throw new Error(authError.message);
  }
  return user?.id || '';
}
async function fetchUserAssistantsFromSupabase(userId: string): Promise<string[]> {
  if (!userId || !isValidUUID(userId)) {
      return [];
  }const { data, error } = await supabase.from('user_assistants').select('assistant_id').eq('user_id', userId);
  if (error) {
    console.error('[fetchUserAssistantsFromSupabase] Error:', error);
    throw new Error(error.message);
  }
  return data?.map(row => row.assistant_id) || [];
}
async function addThreadToSupabase(threadId: string, assistantId: string, userId: string): Promise<void> {
  const data = await supabase.from('chat_threads').insert([{ thread_id: threadId, assistant_id: assistantId, user_id: userId }]);
  if (data.error) {
    console.error('[addThreadToSupabase] Error:', data.error.message);
    throw new Error(data.error.message);
  }
}
async function deleteThreadFromSupabase(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('thread_id', threadId);

  if (error) {
    console.error('[deleteThreadFromSupabase] Error:', error);
    throw error;
  }
}
async function updateThreadInSupabase(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_threads')
    .update({ updated_at: new Date() })
    .eq('thread_id', threadId);
  if (error) {
    console.error('[updateThreadInSupabase] Error:', error);
    throw error as Error;
  }
}
async function addAssistantMessageToSupabase(threadId: string, userId: string, content: string): Promise<string> {
  const { data, error } = await supabase.from('chat_messages').insert([{ user_id: userId, message_id: new Date().toISOString(), thread_id: threadId, content, role: 'assistant' }]);
  if (error) {
    console.error('[addAssistantMessageToSupabase] Error:', error.message);
    throw new Error(error.message);
  }
  return data || '';
}