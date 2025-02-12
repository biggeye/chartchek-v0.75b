import { create } from 'zustand'
import { createClient } from "@/utils/supabase/client"
import { AssistantState, UIState } from '@/types/store'

interface Match {
  snippet: string;
  start: number;
  end: number;
}

interface AssistantStore extends AssistantState, UIState {
  // State Actions
  setUser: (user: AssistantState['user']) => void
  setCurrentThread: (thread: AssistantState['currentThread']) => void
  setCurrentAssistant: (currentAssistant: AssistantState['currentAssistant']) => void
  setMessages: (messages: AssistantState['messages']) => void
  addMessage: (message: AssistantState['messages'][0]) => void
  setRuns: (runs: AssistantState['runs']) => void
  addRun: (run: AssistantState['runs'][0]) => void
  setUserThreads: (threads: AssistantState['userThreads']) => void
  setUserFiles: (files: AssistantState['userFiles']) => void
  setAssistants: (assistants: AssistantState['assistants']) => void
  // Async Actions
  fetchAssistants: () => Promise<void>
  fetchThreads: (assistantId?: string) => Promise<void>
  fetchThreadsCount: () => Promise<number>
  fetchAssistantsCount: () => Promise<number>
  createThread: (assistantId?: string) => Promise<string | null>
  fetchThreadMessages: () => Promise<void>
  fetchUserId: () => Promise<any>
  updateThreadTitle: (threadId: string, newTitle: string) => Promise<any>
  deleteThread: (threadId: string) => Promise<any>
  // UI Actions
  setError: (error: UIState['error']) => void
  setLoading: (isLoading: UIState['isLoading']) => void
  reset: () => void
}

const initialState: AssistantState & UIState = {
  user: null,
  currentThread: null,
  currentAssistant: null,
  messages: [],
  runs: [],
  userThreads: [],
  userFiles: [],
  assistants: [],
  isLoading: false,
  error: null
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  ...initialState,

  // State Actions
  setUser: (user) => set({ user }),
  setCurrentThread: (currentThread) => set({ currentThread }),
  setCurrentAssistant: (currentAssistant) => set({ currentAssistant }),
  setMessages: (messages) => {
    console.log('Setting messages in store:', messages); // Add this line
    set({ messages });
},
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set((state) => ({
    runs: [...state.runs, run]
  })),
  setUserThreads: (userThreads) => set({ userThreads }),
  setUserFiles: (userFiles) => set({ userFiles }),
  setAssistants: (assistants) => set({ assistants }),

  // UI Actions
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  // Async Actions
  fetchAssistantsCount: async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_assistants')
    .select('*', { count: 'exact' })

  if (error) throw error;
  return data?.length ?? 0;
  },

  fetchUserId: async () => {
    const store = get()
    try {
      store.setLoading(true)
      store.setError(null)
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) throw error

      store.setUser(user)
      return user?.id! ?? null;
    } catch (error) {
      
    } finally {
      store.setLoading(false)
    }
  },

  fetchAssistants: async () => {
    const store = get()
    try {
      store.setLoading(true)
      store.setError(null)

      const supabase = createClient()
      const { data: assistants, error } = await supabase
        .from('user_assistants')
        .select('*')

      if (error) throw error

      store.setAssistants(assistants ?? [])
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch assistants')
      console.error('Error fetching assistants:', error)
    } finally {
      store.setLoading(false)
    }
  },

  fetchThreadsCount: async (): Promise<number> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*', { count: 'exact' })
  
    if (error) throw error;
    return data?.length ?? 0;
  },

  fetchThreads: async (assistantId?: string) => {
    const store = get()
    try {
      store.setLoading(true)
      store.setError(null)

      const supabase = createClient()
      const { data: threads, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false });

       if (error) throw error

      store.setUserThreads(threads ?? [])
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch threads')
      console.error('Error fetching threads:', error)
    } finally {
      store.setLoading(false)
    }
  },

  createThread: async (assistantId?: string) => {
    console.log('[Store:createThread] Starting with assistantId:', assistantId)
    try {
      set({ isLoading: true, error: null })
      const formData = new FormData()

      if (assistantId) {
        formData.append('assistant_id', assistantId)
      }
      formData.append('title', 'New Chat')
      const response = await fetch('/api/thread/create', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => {
          console.error('[Store:createThread] Failed to parse error response')
          return null
        })
        console.error('[Store:createThread] Error response:', errorData)
        throw new Error(errorData?.error || 'Failed to create thread')
      }
      const data = await response.json()
      const id = data.thread?.id;
      const threadId = data.thread?.thread_id;
      const userId = data.thread?.user_id;
      const createdAt = data.thread?.created_at;
      const updatedAt = data.thread?.updated_at;
      const isActive = data.thread?.is_active;

      if (threadId && userId && createdAt && updatedAt !== undefined && isActive !== undefined) {
        set({
          currentThread: {
            id: id,
            thread_id: threadId,
            user_id: userId,
            created_at: createdAt,
            updated_at: updatedAt,
            is_active: isActive,
          },
        });
      } else {
        console.error('Missing properties for setting currentThread:', data.thread);
      }
      return threadId
    } catch (error) {
      console.error('[Store:createThread] Caught error:', error)
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ isLoading: false })
     }
  },

  fetchThreadMessages: async () => {
    const store = get()
    const currentThread = store.currentThread

    if (!currentThread?.thread_id) {
      store.setError('No thread selected')
      return
    }

    try {
      store.setLoading(true)
      store.setError(null)

      const supabase = createClient()
      // Inside fetchThreadMessages
        const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', currentThread.thread_id)
        .order('created_at', { ascending: true });

         if (error) throw error

      // Transform database messages into the Message format
      const formattedMessages = messages?.map((msg) => {
        // If msg.content isn’t an array, wrap it. (Assuming the stored column is already parsed into an object.)
        const content = Array.isArray(msg.content) ? msg.content : [msg.content];
        return {
          id: msg.message_id, // or simply msg.id depending on your preference
          role: msg.role,
          content, // now content is in the shape [{ type: 'text', text: { value: "Some message...", annotations: [] } }]
          thread_id: msg.thread_id,
          attachments: [], // adjust if you plan to support file attachments
          created_at: new Date(msg.created_at).getTime(),
          metadata: msg.metadata,
        };
      }) || [];
  
      store.setMessages(formattedMessages);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch thread messages');
      console.error('Error fetching thread messages:', error);
    } finally {
      store.setLoading(false);
    }
  },

  updateThreadTitle: async (threadId: string, newTitle: string) => {
    const client = createClient();
    try {
      console.log('[Store:updateThreadTitle] updating title for thread: ', threadId);
        const { data, error } = await client
            .from('chat_threads')
            .update({ title: newTitle })
            .eq('thread_id', threadId);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating thread title:', error);
    }
  },

  deleteThread: async (threadId: string) => {
    const client = createClient();
    try {
        const { data, error } = await client
            .from('chat_threads')
            .delete()
            .eq('thread_id', threadId);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting thread:', error);
    }
  },

  

  // Utils
  reset: () => set(initialState)
}))
