// store/chatStore.ts
'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { ChatStoreState, SendMessageResult, Thread, ChatContext, PatientContext } from '@/types/store/chat';
import { Document } from '@/types/store/document';
import { ChatMessage } from '@/types/database';
import { Run, ThreadMessage } from '@/types/api/openai';
import { RunStatusResponse } from '@/types/store/chat';
import { OPENAI_ASSISTANT_ID } from '@/utils/openai/server';
import { assistantRoster } from '@/lib/assistant/roster';

// Utility functions outside the store to prevent recreation on each call
const getSupabaseClient = (() => {
  let client: ReturnType<typeof createClient> | null = null;
  return () => {
    if (!client) client = createClient();
    return client;
  };
})();

const getUserId = async () => {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || 'anonymous';
};

// Helper function to merge messages while preserving order
const mergeMessages = (existing: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] => {
  const messageMap = new Map<string, ThreadMessage>();
  
  // Add existing messages to map
  existing.forEach(msg => messageMap.set(msg.id, msg));
  
  // Add or update with incoming messages
  incoming.forEach(msg => messageMap.set(msg.id, msg));
  
  // Convert back to array and sort by created_at
  return Array.from(messageMap.values())
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

// Check if a run status is terminal (completed, failed, cancelled)
const isTerminalState = (status?: string): boolean => {
  return ['completed', 'failed', 'cancelled', 'expired'].includes(status || '');
};

// Create Zustand store for chat state
const useChatStore = create<ChatStoreState>((set, get) => ({
  // --- CORE STATE ---
  currentAssistantId: OPENAI_ASSISTANT_ID || null,
  currentThread: null,
  historicalThreads: [],
  transientFileQueue: [],
  patientContext: null,
  chatContext: null,
  activeRunStatus: null,
  isLoading: false,
  error: null,

  // --- ASSISTANT MANAGEMENT ---
  setCurrentAssistantId: (assistantId: string) => {
    try {
      if (!assistantId) {
        throw new Error('Assistant ID is required');
      }
      
      const { currentThread } = get();
      set({
        currentAssistantId: assistantId,
        currentThread: currentThread
          ? { ...currentThread, assistant_id: assistantId }
          : null
      });
    } catch (error: any) {
      console.error('[chatStore:setCurrentAssistantId] Error:', error);
      set({ error: error.message });
    }
  },

  // --- THREAD MANAGEMENT ---
  createThread: async (assistantId: string): Promise<string> => {
    try {
      set({ isLoading: true, error: null });

      // Validate assistant ID
      if (!assistantId) {
        throw new Error('Assistant ID is required');
      }

      // Get user ID - await it properly
      const userId = await getUserId();
      
      // Create thread in OpenAI
      const response = await fetch('/api/openai/threads', { method: 'POST' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create thread: ${response.status}`);
      }
      
      const { threadId } = await response.json();
      
      if (!threadId) {
        throw new Error('No thread ID returned from API');
      }

      // Update OpenAI Thread Metadata - fixed HTTP method
      const metadataResponse = await fetch(`/api/openai/threads/${threadId}/metadata`, {
        method: 'PATCH', // Fixed from 'UPSERT' to standard HTTP method
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            user_id: userId,
            assistant_id: assistantId,
            created_at: new Date().toISOString()
          }
        })
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        console.error('[chatStore:createThread] Failed to update metadata:', errorData);
      }
      
      // Set as current thread and assistant ID
      set({
        currentThread: { 
          thread_id: threadId, 
          messages: [], 
          tool_resources: null,
          assistant_id: assistantId
        },
        currentAssistantId: assistantId,
        isLoading: false
      });
      
      return threadId;
    } catch (error: any) {
      console.error('[chatStore:createThread] Error:', error);
      set({ error: error.message || 'Failed to create thread', isLoading: false });
      throw error;
    }
  },

  setCurrentThread: (thread: Thread | null) => {
    try {
      // Get assistant ID from thread, environment variable, or use the default from roster
      const assistantId = thread?.assistant_id || OPENAI_ASSISTANT_ID ||
        // Fallback to the default assistant from the roster if available
        (assistantRoster &&
          assistantRoster.length > 0 &&
          assistantRoster.find((a) => a.key === 'default')?.assistant_id);

      if (!assistantId) {
        throw new Error('No assistant ID available');
      }
      
      set({
        currentThread: thread,
        currentAssistantId: assistantId
      });
    } catch (error: any) {
      console.error('[chatStore:setCurrentThread] Error:', error);
      set({ error: error.message });
    }
  },

  // --- HISTORICAL THREADS ---
  fetchHistoricalThreads: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = await getUserId();
      const supabase = getSupabaseClient();
      
      const { data: threads, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const historicalThreads: Thread[] = threads.map((thread: any) => ({
        thread_id: thread.thread_id,
        assistant_id: thread.assistant_id,
        title: thread.title || 'New Chat',
        metadata: thread.metadata,
        messages: [],
        tool_resources: thread.tool_resources
      }));
      
      set(state => ({ 
        ...state,
        historicalThreads, 
        isLoading: false 
      }));
      
      return historicalThreads;
    } catch (error: any) {
      console.error('[chatStore:fetchHistoricalThreads] Error:', error);
      set(state => ({ 
        ...state,
        error: error.message || 'Failed to fetch threads', 
        isLoading: false 
      }));
      throw error;
    }
  },

  // --- MESSAGE MANAGEMENT ---
  sendMessage: async (
    assistantId: string,
    threadId: string,
    content: string,
    attachments = []
  ): Promise<SendMessageResult> => {
    try {
      // Validate required parameters
      if (!assistantId) throw new Error('Assistant ID is required');
      if (!threadId) throw new Error('Thread ID is required');
      if (!content.trim() && attachments.length === 0) {
        throw new Error('Message content or attachments are required');
      }

      // Check if there's an active run for this thread
      const runStatus = await get().checkActiveRun(threadId);
      if (runStatus.isActive) {
        throw new Error(
          `Cannot send message while a run ${runStatus.runId} is active. Current status: ${runStatus.status}`
        );
      }

      const payload = {
        role: 'user',
        content,
        assistant_id: assistantId,
        ...(attachments.length > 0 && { attachments })
      };
      
      const response = await fetch(`/api/openai/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to send message: ${response.status}`);
      }
      
      const messageData = await response.json();
      
      // Fetch updated messages to ensure state is current
      await get().fetchOpenAIMessages(threadId);
      
      return {
        success: true,
        messageId: messageData.id
      };
    } catch (error: any) {
      console.error('[chatStore:sendMessage] Error:', error);
      set(state => ({ ...state, error: error.message || 'Failed to send message' }));
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  },

  // --- MESSAGE FETCHING ---
  fetchOpenAIMessages: async (threadId: string): Promise<ThreadMessage[] | undefined> => {
    if (!threadId) {
      console.error('[fetchOpenAIMessages] No threadId provided');
      return;
    }

    try {
      const response = await fetch(`/api/openai/threads/${threadId}/messages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch messages: ${response.status}`);
      }

      const messagesResponse = await response.json();
      const messages = messagesResponse.data || [];

      set(state => {
        const currentThreadId = state.currentThread?.thread_id;
        if (currentThreadId !== threadId) return state;
        
        return {
          ...state,
          error: null,
          currentThread: state.currentThread
            ? {
                ...state.currentThread,
                messages: mergeMessages(state.currentThread.messages || [], messages),
                has_more: messagesResponse.has_more || false,
                next_page: messagesResponse.next_page
              }
            : null
        };
      });

      return messages;
    } catch (error: any) {
      console.error('[fetchOpenAIMessages] Error fetching messages:', error);
      set(state => ({
        ...state,
        error: error.message || 'Failed to fetch messages'
      }));
      return undefined;
    }
  },

  // --- RUN MANAGEMENT ---
  checkActiveRun: async (threadId: string): Promise<RunStatusResponse> => {
    if (!threadId) {
      console.log('[chatStore:checkActiveRun] No thread ID provided');
      return { isActive: false };
    }

    try {
      const response = await fetch(`/api/openai/threads/${threadId}/run/check`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No active run found - this is a valid state
          set({ activeRunStatus: null });
          return { isActive: false };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to check run status: ${response.status}`);
      }
      
      const runStatus = await response.json();
      const statusResponse: RunStatusResponse = {
        isActive: !isTerminalState(runStatus.status),
        status: runStatus.status,
        runId: runStatus.run_id,
        requiresAction: !!runStatus.required_action,
        requiredAction: runStatus.required_action
      };

      set({ activeRunStatus: statusResponse });
      
      // If run is in a terminal state, fetch messages to get final response
      if (isTerminalState(runStatus.status)) {
        await get().fetchOpenAIMessages(threadId);
      }
      
      return statusResponse;
    } catch (error: any) {
      console.error('[chatStore:checkActiveRun] Error checking run status:', error.message);
      return { isActive: false };
    }
  },

  // --- ERROR HANDLING ---
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useChatStore;
export { useChatStore };