// (/store/chatStore.ts)
'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { ChatStoreState, SendMessageResult, Thread } from '@/types/store/chat';
import { Document } from '@/types/store/document';
import { ChatMessage } from '@/types/database';
import { Run, ThreadMessage } from '@/types/api/openai';
import { RunStatusResponse } from '@/types/store/chat';

// Initialize Supabase client
const supabase = createClient();

// Create a function to get the user ID that doesn't use top-level await
const getUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || 'anonymous';
};

// Create Zustand store for chat state
const useChatStore = create<ChatStoreState>((set, get) => ({
  // --- CORE STATE ---
  currentThread: null,
  historicalThreads: [],
  transientFileQueue: [],
  isLoading: false,
  error: null,
  activeRunStatus: null,

  // --- THREAD MANAGEMENT ---
  createThread: async (assistantId: string): Promise<string> => {
    try {
      set({ isLoading: true, error: null });
    
      // Get user ID
      const userId = await getUserId();
      
      // Create thread in OpenAI
      console.log('[chatStore:createThread] Creating new thread in OpenAI');
      const response = await fetch('/api/threads', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.status}`);
      }
      
      const { threadId } = await response.json();
      
      if (!threadId) {
        throw new Error('No thread ID returned from API');
      }

      // update OpenAI Thread Metadata
      const updatedThread = await fetch(`/api/threads/${threadId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            user_id: userId,
            assistant_id: assistantId
          }
        })
      });

      
      // Set as current thread
      set({
        currentThread: { thread_id: threadId, messages: [], tool_resources: null },
        isLoading: false
      });
      
      return threadId;
    } catch (error: any) {
      console.error('[chatStore:createThread] Error:', error);
      set({ error: error.message || 'Failed to create thread', isLoading: false });
      throw error;
    }
  },
  // Fetches historical threads from Supabase
  fetchHistoricalThreads: async (): Promise<Thread[]> => {
    try {
      set({ isLoading: true, error: null });
      // Fetch thread IDs from Supabase
      const { data: threads, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', await getUserId())
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      // Convert to Thread objects
      const historicalThreads: Thread[] = threads.map((thread: any) => ({
        thread_id: thread.thread_id,
        assistant_id: thread.assistant_id,
        title: thread.title || 'New Chat',
        metadata: thread.metadata,
        messages: [],
        tool_resources: thread.tool_resources
      }));
      
      set({ historicalThreads, isLoading: false });
      return historicalThreads;
    } catch (error: any) {
      console.error('[chatStore:fetchHistoricalThreads] Error:', error);
      set({ error: error.message || 'Failed to fetch threads', isLoading: false });
      throw error;
    }
  },
  // Updates a thread's title
  updateThreadTitle: async (threadId: string, newTitle: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      const updatedTitle = await fetch(`/api/threads/${threadId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            'title': newTitle
          }
        })
      });
       if (!updatedTitle) {
        throw new Error('Failed to update thread title with OpenAI');
      }
      // Update title in Supabase
      const { error } = await supabase
        .from('chat_threads')
        .update({ title: newTitle })
        .eq('thread_id', threadId)
        .eq('user_id', await getUserId());
      
      if (error) {
        throw error;
      }
      
      // Update state
      const { currentThread, historicalThreads } = get();
      
      // Update in historical threads
      const updatedHistoricalThreads = historicalThreads.map(thread => 
        thread.thread_id === threadId 
          ? { ...thread, title: newTitle } 
          : thread
      );
      
      // Update current thread if it's the one being modified
      if (currentThread && currentThread.thread_id === threadId) {
        set({
          currentThread: { ...currentThread, title: newTitle },
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      } else {
        set({
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('[chatStore:updateThreadTitle] Error:', error);
      set({ error: error.message || 'Failed to update thread title', isLoading: false });
      throw error;
    }
  },
  // Deletes a thread via API and updates local history
  deleteThread: async (threadId: string): Promise<void> => {
    try {
      set({ isLoading: true, error: null });
      
      // Delete from OpenAI via API
      const response = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.status}`);
      }
      
      // Delete from Supabase
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('thread_id', threadId)
        .eq('user_id', await getUserId());
      
      if (error) {
        console.error('[chatStore:deleteThread] Error deleting from Supabase:', error);
        throw error;
      }
      
      // Update state
      const { currentThread, historicalThreads } = get();
      const updatedHistoricalThreads = historicalThreads.filter(
        thread => thread.thread_id !== threadId
      );
      
      // If current thread is being deleted, set to null
      if (currentThread && currentThread.thread_id === threadId) {
        set({
          currentThread: null,
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      } else {
        set({
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('[chatStore:deleteThread] Error:', error);
      set({ error: error.message || 'Failed to delete thread', isLoading: false });
      throw error;
    }
  },
  // Sets the current thread
  setCurrentThread: (thread: Thread | null) => {
    set({ currentThread: thread });
  },

  // --- MESSAGE MANAGEMENT ---
  // Sends a user message to OpenAI and clears the file queue
  sendMessage: async (
    assistantId: string,
    threadId: string,
    content: string,
    attachments = []
  ): Promise<SendMessageResult> => {
    try {
      console.log(`[chatStore:sendMessage] Starting send message flow for thread: ${threadId}`);
      set({ isLoading: true, error: null });
      const { transientFileQueue } = get();
      const fileIds = transientFileQueue
        .filter(doc => doc.openai_file_id)
        .map(doc => doc.openai_file_id as string);
      
      // Format the payload according to our standardized message format
      const payload: any = {
        role: 'user',
        content: content, // Keep as string for API consistency
        assistant_id: assistantId
      };
      
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      console.log(`[chatStore:sendMessage] Sending message payload:`, JSON.stringify(payload, null, 2));
      
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`[chatStore:sendMessage] Error from API: ${error}`);
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      set({ 
        transientFileQueue: [],
      });
      
      console.log('[chatStore:sendMessage] Message sent');
      return { success: true };
    } catch (error: any) {
      console.error('[chatStore:sendMessage] Error:', error);
      set({ error: error.message || 'Failed to send message', isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
    // --- ACTIVE RUN MANAGEMENT ---
    addStreamingMessage(message) {
     
    },
  // Check the status of an active run
  checkActiveRun: async (threadId: string) => {
    try {
      console.log(`[chatStore:checkActiveRun] Checking active run for thread: ${threadId}`);
      const response = await fetch(`/api/threads/${threadId}/run/check`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        console.error(`[chatStore:checkActiveRun] Error checking run status: ${response.status}`);
        return { isActive: false };
      }
      
      const runStatus = await response.json();
      console.log('[chatStore:checkActiveRun] Run status:', runStatus);
      return runStatus;
    } catch (error) {
      console.error('[chatStore:checkActiveRun] Error:', error);
      return { isActive: false };
    }
  },
  // Update the active run status in the store
  updateActiveRunStatus: (status: RunStatusResponse | null) => {
    console.log(`[chatStore:updateActiveRunStatus] Updating active run status:`, status);
    
    // Don't continue if run is completed or failed
    if (status?.status && isTerminalState(status.status)) {
      console.log(`[chatStore:updateActiveRunStatus] Run reached terminal state: ${status.status}`);
    }
    
    set({ activeRunStatus: status });
  },
  // Fetch messages directly from OpenAI
  fetchOpenAIMessages: async (threadId: string): Promise<ThreadMessage[] | undefined> => {
    if (!threadId) {
      console.error('[fetchOpenAIMessages] No threadId provided');
      return;
    }

    try {
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'GET'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[fetchOpenAIMessages] Failed to fetch messages:', errorData);
        return;
      }

      const messagesResponse = await response.json();
      const messages = messagesResponse.data || [];

      console.log('[fetchOpenAIMessages] Retrieved messages:', messages.length);

      set((state) => {
        const currentThreadId = state.currentThread?.thread_id;
        if (currentThreadId !== threadId) return state;
        return {
          currentThread: state.currentThread
            ? {
                ...state.currentThread,
                // Merge new messages with existing messages (deduplicating by id)
                messages: mergeMessages(state.currentThread.messages || [], messages),

                has_more: messagesResponse.has_more || false,
                next_page: messagesResponse.next_page
              }
            : null,
        };
      });

      return messages;
    } catch (error) {
      console.error('[fetchOpenAIMessages] Error fetching messages:', error);
      return undefined;
    }
  },
  
  // Add a reference to a message in Supabase (minimal tracking)
  addMessageReference: async (messageId: string, threadId: string, role: string, content: string): Promise<void> => {
    try {
      console.log(`[chatStore:addMessageReference] Adding message reference: ${messageId}`);
      
      // Store minimal reference in Supabase
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          message_id: messageId,
          thread_id: threadId,
          user_id: await getUserId(),
          role: role,
          content: content
        });
      
      if (error) {
        console.error('[chatStore:addMessageReference] Error storing message reference:', error);
        throw error;
      }
      
      console.log(`[chatStore:addMessageReference] Successfully added message reference: ${messageId}`);
    } catch (error: any) {
      console.error('[chatStore:addMessageReference] Error:', error);
      throw error;
    }
  },
  
  // Sets current messages in the state
  setCurrentMessages: (messages: ThreadMessage[]) => {
    const { currentThread } = get();
    
    if (currentThread) {
      set({ currentThread: { ...currentThread, messages } });
    }
  },
  
  // Set current assistant ID
  setCurrentAssistantId: (assistantId: string) => {
    const { currentThread } = get();
    
    if (currentThread) {
      set({ currentThread: { ...currentThread, assistant_id: assistantId } });
    }
  },
  
  // Set a global error message
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Get the latest run for a thread
  getLatestRun: async (threadId: string): Promise<Run | null> => {
    try {
      console.log(`[chatStore:getLatestRun] Fetching latest run for thread: ${threadId}`);
      
      const response = await fetch(`/api/threads/${threadId}/runs`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.status}`);
      }
      
      const { data } = await response.json();
      
      if (data && data.length > 0) {
        console.log(`[chatStore:getLatestRun] Latest run: ${data[0].id}, status: ${data[0].status}`);
        return data[0];
      }
      
      console.log('[chatStore:getLatestRun] No runs found');
      return null;
    } catch (error: any) {
      console.error('[chatStore:getLatestRun] Error:', error);
      return null;
    }
  },
  
  // --- FILE QUEUE MANAGEMENT ---
  // Add a document to the transient file queue
  addFileToQueue: (doc: Document) => {
    const { transientFileQueue } = get();
    set({ transientFileQueue: [...transientFileQueue, doc] });
  },
  
  // Remove a document from the transient file queue
  removeFileFromQueue: (doc: Document) => {
    const { transientFileQueue } = get();
    set({
      transientFileQueue: transientFileQueue.filter(d => d.document_id !== doc.document_id)
    });
  },
  
  // Clear the transient file queue
  clearFileQueue: () => {
    set({ transientFileQueue: [] });
  }

  
}));

function mergeMessages(existing: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] {
  const map = new Map<string, ThreadMessage>();
  existing.forEach((msg) => map.set(msg.id, msg));
  incoming.forEach((msg) => map.set(msg.id, msg));
  // Return sorted messages by created_at
  return Array.from(map.values()).sort((a, b) => a.created_at - b.created_at);
}

// Helper to check if a run status is in a terminal state
export function isTerminalState(status: string | undefined): boolean {
  if (!status) return false;
  // Terminal states in the OpenAI Assistants API
  const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
  return terminalStates.includes(status);
}

export const chatStore = useChatStore;
