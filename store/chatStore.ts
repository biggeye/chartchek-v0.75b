// (/store/chatStore.ts)
'use client';

import { create } from 'zustand';
import { Thread, ChatStoreState, UserChatMessage, RunStatusResponse, SendMessageResult } from '@/types/store/chat';
import { Document } from '@/types/store/document';
import { ChatMessage, ChatMessageAttachment } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { StreamingState } from '@/types/store/streaming';
import { Run } from '@/types/api/openai';
import { useStreamingStore } from './streamingStore';

// Initialize a single Supabase client instance
const supabase = createClient();

// Export the chat store
export const useChatStore = create<ChatStoreState>((set, get) => ({
  // --- CORE STATE ---
  currentThread: null,
  historicalThreads: [],
  transientFileQueue: [] as Document[],
  isLoading: false,
  error: null,
  activeRunStatus: null,

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
    set({ isLoading: true });
    try {
        const response = await fetch(`/api/threads`, { method: 'GET' });
      if (!response.ok) {
        console.error('[chatStore:fetchHistoricalThreads] Failed to fetch threads, status:', response.status);
        throw new Error('Failed to fetch threads');
      }
      const threads: Thread[] = await response.json();
      set({ historicalThreads: threads, isLoading: false });
      return threads;
    } catch (error: any) {
      console.error('[chatStore:fetchHistoricalThreads] Error fetching threads:', error);
      set({ error: error.message || 'Failed to fetch threads', isLoading: false });
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

  // Check if there's an active run for the thread
  checkActiveRun: async (threadId: string): Promise<RunStatusResponse> => {
    try {
      console.log(`[chatStore:checkActiveRun] Checking for active runs in thread ${threadId}`);
      
      const response = await fetch(`/api/threads/${threadId}/run?limit=1&order=desc`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[chatStore:checkActiveRun] API error:`, errorData);
        // If we can't check, assume there is no active run
        return { isActive: false };
      }
      
      const data = await response.json();
      
      // If there are no runs or the most recent run is in a terminal state, return false
      if (!data.data || !data.data.length) {
        console.log(`[chatStore:checkActiveRun] No runs found for thread ${threadId}`);
        return { isActive: false };
      }
      
      const latestRun = data.data[0];
      
      // If the latest run is not in a terminal state, return true (there is an active run)
      const isActive = !isTerminalState(latestRun.status);
      console.log(`[chatStore:checkActiveRun] Latest run status: ${latestRun.status}, isActive: ${isActive}`);
      
      // If the run is in a terminal state, update the chat_threads table
      if (!isActive) {
        try {
          const updateResult = await supabase
            .from('chat_threads')
            .update({
              last_run: latestRun.id,
              last_run_status: latestRun.status
            })
            .eq('thread_id', threadId);
          
          console.log(`[chatStore:checkActiveRun] Updated thread with run status: ${latestRun.status}`, updateResult);
          
          // Use the streamingStore to store run data
          const streamingStore = useStreamingStore.getState();
          
          // If the run has required_action data, also store it in the thread_runs table
          if (latestRun.status === 'requires_action' && latestRun.required_action) {
            await streamingStore.storeRunData(latestRun);
          } else if (isTerminalState(latestRun.status)) {
            // Also store terminal state runs for historical tracking
            await streamingStore.storeRunData(latestRun);
          }
        } catch (updateError) {
          console.error(`[chatStore:checkActiveRun] Failed to update thread run status:`, updateError);
        }
      }
      
      // Prepare a more detailed response about the run state
      const result: RunStatusResponse = {
        isActive,
        status: latestRun.status,
        runId: latestRun.id // Include the run ID in the response
      };
      
      // If the run requires action, include that information
      if (latestRun.status === 'requires_action' && latestRun.required_action) {
        result.requiresAction = true;
        result.requiredAction = {
          type: latestRun.required_action.type,
        };
        
        // Handle tool_calls based on the API response structure
        // The OpenAI API may have one of these structures depending on the version
        if (latestRun.required_action.submit_tool_outputs?.tool_calls) {
          // Standard structure
          result.requiredAction.toolCalls = latestRun.required_action.submit_tool_outputs.tool_calls;
        } else if (latestRun.required_action.tool_calls) {
          // Alternative structure (direct tool_calls property)
          result.requiredAction.toolCalls = latestRun.required_action.tool_calls;
        }
        
        console.log(`[chatStore:checkActiveRun] Run requires action:`, {
          type: result.requiredAction.type,
          toolCallsCount: result.requiredAction.toolCalls?.length || 0,
          toolCalls: result.requiredAction.toolCalls
        });
      }
      
      // Update the active run status in the store
      get().updateActiveRunStatus(result);
      
      return result;
    } catch (err: any) {
      console.error(`[chatStore:checkActiveRun] Error:`, err);
      // If we encounter an error, assume there is no active run
      return { isActive: false };
    }
  },

  // Update the active run status in the store
  updateActiveRunStatus: (status: RunStatusResponse | null) => {
    console.log(`[chatStore:updateActiveRunStatus] Updating active run status:`, status);
    
    // If the status is a terminal state, ensure isActive is set to false
    if (status && status.status && isTerminalState(status.status)) {
      status.isActive = false;
    }
    
    set({ activeRunStatus: status });
  },

  // Sends a user message and clears the file queue
  sendMessage: async (
    assistantId: string,
    threadId: string,
    content: string,
    attachments: ChatMessageAttachment[] = []
  ): Promise<SendMessageResult> => {
    set({ isLoading: true, error: null });
    try {
      console.log(`[chatStore:sendMessage] Sending message to thread ${threadId}:`, {
        contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        attachments: attachments.length
      });
      
      // Check if there's an active run for this thread
      const runStatus = get().activeRunStatus;
      
      // If there's an active run, update the state and return error info
      if (runStatus && runStatus.isActive) {
        console.log(`[chatStore:sendMessage] Active run detected with status: ${runStatus.status}`);
        
        // Check the run status again to make sure it's up-to-date
        await get().checkActiveRun(threadId);
        
        // Set loading to false and return an error object
        set({ isLoading: false });
        return { 
          success: false, 
          error: `Cannot send message while run is active (status: ${runStatus.status})` 
        };
      }
      
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
      addAssistantIdToThread(assistantId, threadId);
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
        return state; // No changes if we're not viewing this thread
      });
      
      // After sending the message, we should start a run
      // Refresh the active run status after starting a run
      setTimeout(() => {
        get().checkActiveRun(threadId);
      }, 1000);
      
      return { success: true };
    } catch (err: any) {
      console.error(`[chatStore:sendMessage] Error:`, err);
      set({ error: err.message });
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches current messages for the given thread
  fetchCurrentMessages: async (threadId: string) => {
    console.log(`[chatStore:fetchCurrentMessages] Starting to fetch messages for thread: ${threadId}`);
    set({ isLoading: true });
    try {
      console.log(`[chatStore:fetchCurrentMessages] Making API request to /api/threads/${threadId}/messages`);
      const response = await fetch(`/api/threads/${threadId}/messages`);
      
      console.log('[chatStore:fetchCurrentMessages] API response status:', response.status, response.statusText);
      if (!response.ok) {
        console.error(`[chatStore:fetchCurrentMessages] Failed to fetch messages, status: ${response.status}`);
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      const messages = data?.data || data || [];
      console.log(`[chatStore:fetchCurrentMessages] Successfully fetched ${messages.length} messages`);
      console.log('[chatStore:fetchCurrentMessages] Messages data:', messages);
      
      set((state: ChatStoreState) => {
        const currentThread = state.currentThread;
        if (currentThread && currentThread.thread_id === threadId) {
          console.log(`[chatStore:fetchCurrentMessages] Updating current thread with fetched messages`);
          return {
            currentThread: { ...currentThread, messages },
            isLoading: false
          };
        }
        return { ...state, isLoading: false };
      });
      return messages;
    } catch (error) {
      console.error('[chatStore:fetchCurrentMessages] Error fetching messages:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch messages', isLoading: false });
      throw error;
    }
  },

  // Adds an assistant message (delegated to Supabase)
  addAssistantMessage: (content: StreamingState['currentStreamContent'], messageId: string): Promise<string> => {
    try {
      const threadId = get().currentThread?.thread_id;
      if (!threadId) {
        throw new Error('No thread ID');
      }
      const data = addAssistantMessageToSupabase(threadId, content, messageId);
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

  // Stub for file upload; replace with your actual implementation.
  uploadFile: async (file: Document): Promise<string> => {
    if (file.openai_file_id) return file.openai_file_id;
    const simulatedId = `uploaded-file-id-${file.document_id}`;
    return simulatedId;
  },

  // Fetch file names given a vector store ID
  fetchFileNames: async (vectorStoreId: string): Promise<string[]> => {
    console.log(`[chatStore:fetchFileNames] Starting to fetch file names for vector store: ${vectorStoreId}`);
    set({ isLoading: true });
    try {
      console.log(`[chatStore:fetchFileNames] Making API request to /api/vector/${vectorStoreId}/files`);
      const response = await fetch(`/api/vector/${vectorStoreId}/files`, { method: 'GET' });
      
      console.log('[chatStore:fetchFileNames] API response status:', response.status, response.statusText);
      if (!response.ok) {
        console.error(`[chatStore:fetchFileNames] Failed to fetch file IDs, status: ${response.status}`);
        throw new Error('Failed to fetch file IDs');
      }
      
      const { fileIds } = await response.json();
      console.log(`[chatStore:fetchFileNames] Successfully fetched ${fileIds?.length || 0} file IDs:`, fileIds);
      
      if (!fileIds?.length) {
        console.log('[chatStore:fetchFileNames] No file IDs found, returning empty array');
        set({ isLoading: false });
        return [];
      }
      
      console.log('[chatStore:fetchFileNames] Querying Supabase for file names with IDs:', fileIds);
      const { data: documents, error } = await supabase
        .from('documents')
        .select('file_name')
        .in('openai_file_id', fileIds);
        
      if (error) {
        console.error('[chatStore:fetchFileNames] Supabase error:', error);
        set({ isLoading: false });
        throw error;
      }
      
      const fileNames = documents?.map((doc: any) => doc.file_name) || [];
      console.log(`[chatStore:fetchFileNames] Successfully fetched ${fileNames.length} file names:`, fileNames);
      set({ isLoading: false });
      return fileNames;
    } catch (error) {
      console.error('[chatStore:fetchFileNames] Error fetching file names:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch file names', isLoading: false });
      throw error;
    }
  },

  // Fetches documents via API
  fetchDocuments: async (): Promise<Document[]> => {
    console.log('[chatStore:fetchDocuments] Starting to fetch documents');
    set({ isLoading: true });
    try {
      console.log('[chatStore:fetchDocuments] Making API request to /api/documents');
      const response = await fetch('/api/documents', { method: 'GET' });
      
      console.log('[chatStore:fetchDocuments] API response status:', response.status, response.statusText);
      if (!response.ok) {
        console.error(`[chatStore:fetchDocuments] Failed to fetch documents, status: ${response.status}`);
        throw new Error('Failed to fetch documents');
      }
      
      const docs: Document[] = await response.json();
      console.log(`[chatStore:fetchDocuments] Successfully fetched ${docs.length} documents`);
      console.log('[chatStore:fetchDocuments] Documents data:', docs);
      
      set({ isLoading: false });
      return docs;
    } catch (error: any) {
      console.error('[chatStore:fetchDocuments] Error fetching documents:', error);
      set({ error: error.message || 'Failed to fetch documents', isLoading: false });
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

  // Get the latest run for a thread
  getLatestRun: async (threadId: string): Promise<Run | null> => {
    try {
      console.log(`[chatStore:getLatestRun] Getting latest run for thread ${threadId}`);
      
      const response = await fetch(`/api/threads/${threadId}/run?limit=1&order=desc`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[chatStore:getLatestRun] API error:`, errorData);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data.length) {
        console.log(`[chatStore:getLatestRun] No runs found for thread ${threadId}`);
        return null;
      }
      
      return data.data[0];
    } catch (err: any) {
      console.error(`[chatStore:getLatestRun] Error:`, err);
      return null;
    }
  },
}));

// Helper to check if a run status is in a terminal state
export function isTerminalState(status: string | undefined): boolean {
  if (!status) return false;
  
  // Terminal states in the OpenAI Assistants API
  const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
  return terminalStates.includes(status);
}

// --- HELPER FUNCTIONS ---

export async function fetchUserIdFromSupabase(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('User not authenticated');
  return data.user.id;
}

export async function addAssistantIdToThread(assistantId: string, threadId: string): Promise<void> {
  try {
    console.log(`[chatStore:addAssistantIdToThread] Updating assistant ID for thread: ${threadId}`);
    
    // In the Supabase schema, the OpenAI thread ID is stored in the 'thread_id' column
    // and the auto-generated UUID is in the 'id' column
    const { error: updateError } = await supabase
      .from('chat_threads')
      .update({ assistant_id: assistantId })
      .eq('thread_id', threadId);
    
    if (updateError) {
      console.error(`[chatStore:addAssistantIdToThread] Error updating thread:`, updateError);
      throw new Error(updateError.message);
    }
    
    console.log(`[chatStore:addAssistantIdToThread] Successfully updated assistant ID to: ${assistantId}`);
  } catch (error: any) {
    console.error(`[chatStore:addAssistantIdToThread] Error:`, error);
    throw error;
  }
}

export async function addAssistantMessageToSupabase(
  threadId: string,
  content: any,
  messageId: string
): Promise<string> {
  try {
    console.log(`[chatStore:addAssistantMessageToSupabase] Adding assistant message to thread: ${threadId}`);
    
    const userId = await fetchUserIdFromSupabase();

    const { data: addedMessage, error } = await supabase
      .from('chat_messages')
      .insert({ 
        message_id: messageId,
        user_id: userId,
        thread_id: threadId, 
        content, 
        role: 'assistant' 
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`[chatStore:addAssistantMessageToSupabase] Error:`, error);
      throw new Error(error.message);
    }
    
    console.log(`[chatStore:addAssistantMessageToSupabase] Successfully added message with ID: ${addedMessage.id}`);
    return addedMessage.id;
  } catch (error: any) {
    console.error(`[chatStore:addAssistantMessageToSupabase] Error:`, error);
    throw error;
  }
}

export async function updateMessageMetadata(msgId: string, metadata: any) {
  try {
    console.log(`[chatStore:updateMessageMetadata] Updating message ${msgId} metadata:`, metadata);
    
    // First get existing metadata (if any)
    const { data: existingMessage, error: fetchError } = await supabase
      .from('chat_messages')
      .select('metadata')
      .eq('id', msgId)
      .single();
      
    if (fetchError) {
      console.error(`[chatStore:updateMessageMetadata] Error fetching existing metadata:`, fetchError);
      throw fetchError;
    }
    
    // Merge existing metadata with new metadata
    const mergedMetadata = {
      ...(existingMessage?.metadata || {}),
      ...metadata
    };
    
    // Update with merged metadata
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ metadata: mergedMetadata })
      .eq('id', msgId);
    
    if (updateError) {
      console.error(`[chatStore:updateMessageMetadata] Error updating metadata:`, updateError);
      throw updateError;
    }
    
    console.log(`[chatStore:updateMessageMetadata] Successfully updated metadata for message: ${msgId}`);
  } catch (error: any) {
    console.error('[chatStore:updateMessageMetadata] Error:', error);
    throw error;
  }
}
