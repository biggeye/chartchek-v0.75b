import { create } from 'zustand'
import { createClient } from "@/utils/supabase/client"
import { AssistantState, UIState } from '@/types/store'
import { MessageRole } from '@/types/database'

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
  fetchThreads: () => Promise<void>
  createThread: (assistantId?: string) => Promise<string | null>
  fetchThreadMessages: () => Promise<void>
  fetchUserId: () => Promise<string | null>
  
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
  setMessages: (messages) => set({ messages }),
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

  fetchThreads: async () => {
    const store = get()
    try {
      store.setLoading(true)
      store.setError(null)
      
      const supabase = createClient()
      const { data: threads, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('created_at', { ascending: false })
      
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
        console.log('[Store:createThread] Added assistant_id to FormData:', assistantId)
      }
      formData.append('title', 'New Chat')
      console.log('[Store:createThread] FormData prepared:', {
        assistant_id: formData.get('assistant_id'),
        title: formData.get('title')
      })
      
      console.log('[Store:createThread] Sending request to /api/thread/create')
      const response = await fetch('/api/thread/create', {
        method: 'POST',
        body: formData
      })
      console.log('[Store:createThread] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => {
          console.error('[Store:createThread] Failed to parse error response')
          return null
        })
        console.error('[Store:createThread] Error response:', errorData)
        throw new Error(errorData?.error || 'Failed to create thread')
      }
      
      const data = await response.json()
      console.log('[Store:createThread] Success response:', data)
      
      // Extract thread_id from the response (this should be the OpenAI thread ID)
      const threadId = data.thread?.thread_id
      if (!threadId) {
        console.error('[Store:createThread] No thread ID in response:', data)
        throw new Error('No thread ID in response')
      }
      
      console.log('[Store:createThread] Extracted OpenAI threadId:', threadId)
      set({ currentThread: threadId })
      return threadId
    } catch (error) {
      console.error('[Store:createThread] Caught error:', error)
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ isLoading: false })
      console.log('[Store:createThread] Completed')
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
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', currentThread.thread_id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Transform database messages into the Message format
      const formattedMessages = messages?.map(msg => ({
        id: msg.message_id,
        role: msg.role as MessageRole,
        content: [{
          type: 'text' as const,
          text: {
            value: msg.content,
            annotations: []
          }
        }],
        thread_id: msg.thread_id,
        attachments: [],
        created_at: new Date(msg.created_at).getTime(),
        metadata: null
      })) || []
      
      store.setMessages(formattedMessages)
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch thread messages')
      console.error('Error fetching thread messages:', error)
    } finally {
      store.setLoading(false)
    }
  },

  fetchUserId: async () => {
    const store = get()
    try {
      store.setLoading(true)
      store.setError(null)
      
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error

      store.setUser(user)
      return user?.id || null
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch user ID')
      console.error('Error fetching user:', error)
      return null
    } finally {
      store.setLoading(false)
    }
  },

  // Utils
  reset: () => set(initialState)
}))
