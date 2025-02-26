// (/store/chatStore.ts)
'use client';

import { create } from 'zustand';
import { ChatStoreState, Thread, UserChatMessage } from '@/types/store/chat';
import { Document } from '@/types/store/document';
import { ChatMessage, ChatMessageAttachment } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { StreamingState } from '@/types/store/streaming';

// Initialize a single Supabase client instance
const supabase = createClient();

export const useChatStore = create<ChatStoreState>((set, get) => ({
  // --- CORE STATE ---
  currentThread: null,
  historicalThreads: [],
  transientFileQueue: [] as Document[],
  isLoading: false,
  error: null,

  // -------------------------------------------------
  // THREAD MANAGEMENT
  // -------------------------------------------------
  // Creates a new thread (merged functionality from ensureThread and createThread)
  createThread: async (): Promise<string> => {
    try {
      console.log('[chatStore] Creating new thread...');
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[chatStore] Thread creation failed:', errorData);
        throw new Error(`Failed to create thread: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[chatStore] Thread creation API response:', data);
      
      // Ensure we have a thread_id
      if (!data.threadId && !data.thread_id) {
        console.error('[chatStore] Thread creation response missing thread ID');
        throw new Error('Thread creation response missing thread ID');
      }
      
      const threadId = data.threadId || data.thread_id;
      
      const newThread: Thread = {
        thread_id: threadId,
        messages: [],
        tool_resources: null,
        title: data.title || 'Untitled', // optional field
      };
      
      // Update both currentThread and historicalThreads
      set((state: ChatStoreState) => {
        console.log('[chatStore] Setting state with new thread:', newThread);
        return {
          currentThread: newThread,
          historicalThreads: [newThread, ...state.historicalThreads],
        };
      });
      
      console.log('[chatStore] Created and set new thread:', newThread);
      return threadId;
    } catch (error: any) {
      console.error('[chatStore] Thread creation error:', error);
      set({ error: error.message || 'Failed to create thread' });
      throw error;
    }
  },

  // Fetches historical threads via API
  fetchHistoricalThreads: async (): Promise<Thread[]> => {
    try {
      const response = await fetch(`/api/threads`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }
      const threads: Thread[] = await response.json();
      console.log('[fetchHistoricalThreads] threads:', threads);
      set({ historicalThreads: threads });
      return threads;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch threads' });
      throw error;
    }
  },

  // Updates a thread's title
  updateThreadTitle: async (threadId: string, newTitle: string): Promise<void> => {
    try {
      const update = await supabase
        .from('chat_threads')
        .update({ title: newTitle })
        .eq('thread_id', threadId)
        .single();
      if (!update) {
        throw new Error('Failed to update thread title');
      }
      set((state: ChatStoreState) => {
        const updatedThreads = state.historicalThreads.map((t: Thread) =>
          t.thread_id === threadId ? { ...t, title: newTitle } : t
        );
        const updatedCurrentThread =
          state.currentThread && state.currentThread.thread_id === threadId
            ? { ...state.currentThread, title: newTitle }
            : state.currentThread;
        return { historicalThreads: updatedThreads, currentThread: updatedCurrentThread };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update thread title' });
      throw error;
    }
  },

  // Deletes a thread via API and updates local history
  deleteThread: async (threadId: string): Promise<void> => {
    try {
      const threadDeleted = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      });
      if (!threadDeleted.ok) {
        throw new Error('Failed to delete thread');
      }
      set((state: ChatStoreState) => ({
        historicalThreads: state.historicalThreads.filter((t: Thread) => t.thread_id !== threadId),
        currentThread:
          state.currentThread && state.currentThread.thread_id === threadId ? null : state.currentThread,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete thread' });
      throw error;
    }
  },

  // Sets the current thread
  setCurrentThread: (thread: Thread | null) => {
    set({ currentThread: thread });
  },

  // -------------------------------------------------
  // MESSAGE MANAGEMENT
  // -------------------------------------------------
  // Sends a user message and clears the file queue
  sendMessage: async (
    assistantId: string,
    threadId: string,
    content: string,
    attachments: ChatMessageAttachment[] = []
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      console.log(`[chatStore:sendMessage] Sending message to thread ${threadId}:`, {
        contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        attachments: attachments.length
      });
      
      const message: UserChatMessage = {
        role: 'user',
        content,
        attachments,
      };
      
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[chatStore:sendMessage] API error:`, errorData);
        throw new Error(`Failed to send message: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[chatStore:sendMessage] Message sent successfully:`, data);
      
      // Add this message to the current thread's messages immediately
      // This gives immediate feedback to the user before real-time updates arrive
      set((state: ChatStoreState) => {
        if (state.currentThread && state.currentThread.thread_id === threadId) {
          console.log(`[chatStore:sendMessage] Updating current thread with new message`);
          return {
            currentThread: {
              ...state.currentThread,
              messages: [...(state.currentThread.messages || []), data.message]
            }
          };
        }
        return state;
      });
      console.log(`[chatStore:sendMessage] sending stream request to thread ${threadId} with assistantId ${assistantId}`);
     
      get().clearFileQueue();
    } catch (err: any) {
      console.error(`[chatStore:sendMessage] Error:`, err);
      set({ error: err.message || 'Failed to send message' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches current messages for the given thread
  fetchCurrentMessages: async (threadId: string) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      const messages = data?.data || data || [];
      set((state: ChatStoreState) => {
        const currentThread = state.currentThread;
        if (currentThread && currentThread.thread_id === threadId) {
          return {
            currentThread: { ...currentThread, messages },
          };
        }
        return state;
      });
      return messages;
    } catch (error) {
      console.error('[fetchCurrentMessages] Error:', error);
      throw error;
    }
  },

  // Adds an assistant message (delegated to Supabase)
  addAssistantMessage: (content: StreamingState['currentStreamContent']): Promise<string> => {
    try {
      const threadId = get().currentThread?.thread_id;
      if (!threadId) {
        throw new Error('No thread ID');
      }
      const data = addAssistantMessageToSupabase(threadId, content);
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to add message' });
      throw error;
    }
  },

  // Replaces the messages in the current thread
  setCurrentMessages: (messages: ChatMessage[]) => {
    const thread = get().currentThread;
    if (thread) {
      set({ currentThread: { ...thread, messages } });
    }
  },

  // Sets up a realtime subscription for new messages and appends them to the current thread.
  subscribeToRealtimeMessages: (threadId: string) => {
    const channel = supabase
      .channel('realtime-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: any) => {
          console.log('[subscribeToRealtimeMessages] New message:', payload);
          const newMessage = payload.new;
          set((state: ChatStoreState) => {
            if (state.currentThread && state.currentThread.thread_id === threadId) {
              return {
                currentThread: {
                  ...state.currentThread,
                  messages: [...(state.currentThread.messages || []), newMessage],
                },
              };
            }
            return {};
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // -------------------------------------------------
  // FILE / DOCUMENT MANAGEMENT
  // -------------------------------------------------
  addFileToQueue: (doc: Document) => {
    set((state: ChatStoreState) => ({
      transientFileQueue: [...state.transientFileQueue, doc],
    }));
  },

  removeFileFromQueue: (doc: Document) => {
    set((state: ChatStoreState) => ({
      transientFileQueue: state.transientFileQueue.filter(
        (d: Document) => d.document_id !== doc.document_id
      ),
    }));
  },

  clearFileQueue: () => {
    set({ transientFileQueue: [] });
  },

  // Fetch file names given a vector store ID
  fetchFileNames: async (vectorStoreId: string): Promise<string[]> => {
    try {
      const response = await fetch(`/api/vector/${vectorStoreId}/files`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to fetch file IDs');
      }
      const { fileIds } = await response.json();
      if (!fileIds?.length) {
        return [];
      }
      const { data: documents, error } = await supabase
        .from('documents')
        .select('file_name')
        .in('openai_file_id', fileIds);
      if (error) {
        console.error('[fetchFileNames] Supabase error:', error);
        throw error;
      }
      return documents?.map((doc: any) => doc.file_name) || [];
    } catch (error) {
      console.error('[fetchFileNames] Error:', error);
      throw error;
    }
  },

  // Stub for file upload; replace with your actual implementation.
  uploadFile: async (file: Document): Promise<string> => {
    if (file.openai_file_id) return file.openai_file_id;
    const simulatedId = `uploaded-file-id-${file.document_id}`;
    return simulatedId;
  },

  // Fetches documents via API
  fetchDocuments: async (): Promise<Document[]> => {
    try {
      const response = await fetch('/api/documents', { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const docs: Document[] = await response.json();
      return docs;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch documents' });
      throw error;
    }
  },

  // -------------------------------------------------
  // USER / ERROR MANAGEMENT
  // -------------------------------------------------
  // Update current assistant ID in the active thread
  setCurrentAssistantId: (assistantId: string) => {
    const thread = get().currentThread;
    if (thread) {
      set({ currentThread: { ...thread, assistant_id: assistantId } });
    }
  },

  // Set a global error message
  setError: (error: string | null) => {
    set({ error });
  },
}));

// --- HELPER FUNCTIONS ---

async function fetchUserIdFromSupabase(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(authError.message);
  }
  return user?.id || '';
}

async function addAssistantMessageToSupabase(
  threadId: string,
  content: StreamingState['currentStreamContent']
): Promise<string> {
  const userId = await fetchUserIdFromSupabase();
  const { data, error } = await supabase.from('chat_messages').insert([
    {
      user_id: userId,
      message_id: new Date().toISOString(),
      thread_id: threadId,
      content,
      role: 'assistant',
    },
  ]);
  if (error) {
    throw error;
  }
  return data ? 'Message added successfully' : 'No data returned';
}
