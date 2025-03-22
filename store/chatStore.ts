  // (/store/chatStore.ts)
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
    currentAssistantId: OPENAI_ASSISTANT_ID || null,
    patientContext: null,
    chatContext: null,

    // --- THREAD MANAGEMENT ---
    createThread: async (assistantId: string): Promise<string> => {
      try {
        set({ isLoading: true, error: null });
      
        // Validate assistant ID
        if (!assistantId) {
          throw new Error('Assistant ID is required');
        }

        // Get user ID
        const userId = await getUserId();
        
        // Create thread in OpenAI
        console.log('[chatStore:createThread] Creating new thread in OpenAI');
        const response = await fetch('/api/threads', { method: 'POST' });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to create thread: ${response.status}`);
        }
        
        const { threadId } = await response.json();
        
        if (!threadId) {
          throw new Error('No thread ID returned from API');
        }

        // update OpenAI Thread Metadata
        const metadataResponse = await fetch(`/api/threads/${threadId}/metadata`, {
          method: 'PATCH',
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

    // --- MESSAGE MANAGEMENT ---
    sendMessage: async (
      assistantId: string,
      threadId: string,
      content: string,
      attachments = []
    ): Promise<SendMessageResult> => {
      try {
        // Validate required parameters
        if (!assistantId) {
          throw new Error('Assistant ID is required');
        }
        if (!threadId) {
          throw new Error('Thread ID is required');
        }
        if (!content.trim() && attachments.length === 0) {
          throw new Error('Message content or attachments are required');
        }

        // Check if there's an active run for this thread
        const runStatus = await get().checkActiveRun(threadId);
        if (runStatus.isActive) {
          throw new Error(`Cannot send message while a run ${runStatus.runId} is active. Current status: ${runStatus.status}`);
        }

        console.log('[chatStore:sendMessage] Starting send message flow for thread:', threadId);
        
        const payload = {
          role: 'user',
          content,
          assistant_id: assistantId,
          ...(attachments.length > 0 && { attachments })
        };
        
        console.log('[chatStore:sendMessage] Sending message payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(`/api/threads/${threadId}/messages`, {
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
        
        console.log('[chatStore:sendMessage] Message sent');
        
        return {
          success: true,
          messageId: messageData.id
        };
      } catch (error: any) {
        console.error('[chatStore:sendMessage] Error:', error);
        set({ error: error.message || 'Failed to send message' });
        return {
          success: false,
          error: error.message || 'Failed to send message'
        };
      }
    },

    // --- ACTIVE RUN MANAGEMENT ---
    checkActiveRun: async (threadId: string): Promise<RunStatusResponse> => {
      if (!threadId) {
        console.log('[chatStore:checkActiveRun] No thread ID provided');
        return { isActive: false };
      }

      console.log('[chatStore:checkActiveRun] Checking active run for thread:', threadId);
      
      try {
        const response = await fetch(`/api/threads/${threadId}/run/check`);
        
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

    // --- MESSAGE FETCHING ---
    fetchOpenAIMessages: async (threadId: string): Promise<ThreadMessage[] | undefined> => {
      if (!threadId) {
        console.error('[fetchOpenAIMessages] No threadId provided');
        return;
      }

      try {
        const response = await fetch(`/api/threads/${threadId}/messages`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[fetchOpenAIMessages] Failed to fetch messages:', errorData);
          
          // Update global error state with specific error message
          set((state) => ({
            ...state,
            error: errorData.error || 'Failed to fetch messages'
          }));
          
          return;
        }

        const messagesResponse = await response.json();
        const messages = messagesResponse.data || [];

        console.log('[fetchOpenAIMessages] Retrieved messages:', messages.length);

        set((state) => {
          const currentThreadId = state.currentThread?.thread_id;
          if (currentThreadId !== threadId) return state;
          
          // Clear any previous error state
          const newState = {
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
          
          return newState;
        });

        return messages;
      } catch (error: any) {
        console.error('[fetchOpenAIMessages] Error fetching messages:', error);
        
        // Update global error state
        set((state) => ({
          ...state,
          error: error.message || 'Failed to fetch messages'
        }));
        
        return undefined;
      }
    },

    // --- ERROR HANDLING ---
    setError: (error: string | null) => set({ error }),

    // --- HELPER FUNCTIONS ---
    clearError: () => set({ error: null }),
    
    // Required interface implementations
    fetchHistoricalThreads: async () => {
      try {
        set({ isLoading: true, error: null });
        const { data: threads, error } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('user_id', await getUserId())
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
        
        set({ historicalThreads, isLoading: false });
        return historicalThreads;
      } catch (error: any) {
        console.error('[chatStore:fetchHistoricalThreads] Error:', error);
        set({ error: error.message || 'Failed to fetch threads', isLoading: false });
        throw error;
      }
    },

    deleteThread: async (threadId: string) => {
      try {
        set({ isLoading: true, error: null });
        const response = await fetch(`/api/threads/${threadId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete thread: ${response.status}`);
        
        const { error } = await supabase
          .from('chat_threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', await getUserId());
        
        if (error) throw error;
        
        const { currentThread, historicalThreads } = get();
        const updatedHistoricalThreads = historicalThreads.filter(t => t.thread_id !== threadId);
        
        set({
          currentThread: currentThread?.thread_id === threadId ? null : currentThread,
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      } catch (error: any) {
        console.error('[chatStore:deleteThread] Error:', error);
        set({ error: error.message || 'Failed to delete thread', isLoading: false });
        throw error;
      }
    },

    updateThreadTitle: async (threadId: string, newTitle: string) => {
      try {
        set({ isLoading: true, error: null });
        const response = await fetch(`/api/threads/${threadId}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: { title: newTitle }
          })
        });
        
        if (!response.ok) throw new Error('Failed to update thread title');
        
        const { error } = await supabase
          .from('chat_threads')
          .update({ title: newTitle })
          .eq('thread_id', threadId)
          .eq('user_id', await getUserId());
        
        if (error) throw error;
        
        const { currentThread, historicalThreads } = get();
        const updatedHistoricalThreads = historicalThreads.map(t => 
          t.thread_id === threadId ? { ...t, title: newTitle } : t
        );
        
        set({
          currentThread: currentThread?.thread_id === threadId 
            ? { ...currentThread, title: newTitle }
            : currentThread,
          historicalThreads: updatedHistoricalThreads,
          isLoading: false
        });
      } catch (error: any) {
        console.error('[chatStore:updateThreadTitle] Error:', error);
        set({ error: error.message || 'Failed to update thread title', isLoading: false });
        throw error;
      }
    },

    setCurrentThread: (thread: Thread | null) => {
      // Get assistant ID from thread, environment variable, or use the default from roster
      const assistantId = thread?.assistant_id || OPENAI_ASSISTANT_ID || 
        // Fallback to the default assistant from the roster if available
        (assistantRoster && 
        assistantRoster.length > 0 && 
        assistantRoster.find((a) => a.key === 'default')?.key);
      
      if (!assistantId) {
        console.error('[chatStore:setCurrentThread] No assistant ID available');
        return;
      }
      set({ 
        currentThread: thread,
        currentAssistantId: assistantId
      });
    },

    addMessageReference: async (messageId: string, threadId: string, role: string, content: string) => {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            message_id: messageId,
            thread_id: threadId,
            user_id: await getUserId(),
            role,
            content
          });
        
        if (error) throw error;
      } catch (error: any) {
        console.error('[chatStore:addMessageReference] Error:', error);
        throw error;
      }
    },

    setCurrentMessages: (messages: ThreadMessage[]) => {
      const { currentThread } = get();
      if (currentThread) {
        set({ currentThread: { ...currentThread, messages } });
      }
    },

    updateActiveRunStatus: (status: RunStatusResponse | null) => set({ activeRunStatus: status }),
    getLatestRun: async (threadId: string) => {
      try {
        const response = await fetch(`/api/threads/${threadId}/runs`);
        if (!response.ok) throw new Error(`Failed to fetch runs: ${response.status}`);
        
        const { data } = await response.json();
        return data?.[0] || null;
      } catch (error: any) {
        console.error('[chatStore:getLatestRun] Error:', error);
        return null;
      }
    },

    addStreamingMessage: (message: string) => {
      const { currentThread } = get();
      if (currentThread) {
        const newMessage: ThreadMessage = {
          id: `temp_${Date.now()}`,
          object: 'thread.message',
          created_at: Date.now(),
          thread_id: currentThread.thread_id,
          role: 'assistant',
          content: [{
            type: 'text',
            text: {
              value: message
            }
          }],
          file_ids: [],
          assistant_id: currentThread.assistant_id || null,
          run_id: null,
          metadata: null
        };

        set({
          currentThread: {
            ...currentThread,
            messages: [...(currentThread.messages || []), newMessage]
          }
        });
      }
    },

    addFileToQueue: (doc: Document) => {
      set((state) => ({
        transientFileQueue: [...state.transientFileQueue, doc]
      }));
    },

    removeFileFromQueue: (doc: Document) => {
      set((state) => ({
        transientFileQueue: state.transientFileQueue.filter(
          (file) => file.document_id !== doc.document_id
        )
      }));
    },

    clearFileQueue: () => {
      set({ transientFileQueue: [] });
    },

    sendMessageWithFiles: async (
      assistantId: string,
      content: string,
      files: Document[]
    ): Promise<SendMessageResult> => {
      try {
        // Validate required parameters
        if (!assistantId) {
          throw new Error('Assistant ID is required');
        }
        if (!content.trim() && files.length === 0) {
          throw new Error('Message content or files are required');
        }

        console.log('[chatStore:sendMessageWithFiles] Starting send message with files flow');
        
        // Get the current thread or create a new one
        const currentThread = get().currentThread;
        const threadId = currentThread?.thread_id || await get().createThread(assistantId);
        
        if (!threadId) {
          throw new Error('Failed to create or retrieve thread ID');
        }
        
        // Prepare file IDs from OpenAI
        const fileIds = await Promise.all(
          files.map(async (file) => {
            if (file.openai_file_id) {
              return file.openai_file_id;
            }
            
            // We should never reach here as files should be processed before reaching this point
            console.warn('[chatStore:sendMessageWithFiles] File missing OpenAI file ID:', file.file_name);
            return null;
          })
        );
        
        // Filter out any null file IDs from failed lookups
        const validFileIds = fileIds.filter(Boolean) as string[];
        
        // Format attachments according to the ChatMessageAttachment interface
        const formattedAttachments = validFileIds.map(fileId => ({
          file_id: fileId,
          tools: [{ type: 'file_search' as const }]
        }));
        
        // Send the message with attachments
        const result = await get().sendMessage(assistantId, threadId, content, formattedAttachments);
        
        // Clear the file queue after successful message sending
        if (result.success) {
          get().clearFileQueue();
        }
        
        return {
          ...result,
          threadId
        };
      } catch (error: any) {
        console.error('[chatStore:sendMessageWithFiles] Error:', error);
        set({ error: error.message || 'Failed to send message with files' });
        return {
          success: false,
          error: error.message || 'Failed to send message with files'
        };
      }
    },

    setCurrentAssistantId: (assistantId: string) => {
      if (!assistantId) {
        console.error('[chatStore:setCurrentAssistantId] Assistant ID is required');
        return;
      }
      const { currentThread } = get();
      set({ 
        currentAssistantId: assistantId,
        currentThread: currentThread 
          ? { ...currentThread, assistant_id: assistantId }
          : null
      });
    },

    updateChatContext: (context: Partial<ChatContext>) => {
      const currentContext = get().chatContext || { facilityId: null, patientId: null, patientName: null };
      set({ chatContext: { ...currentContext, ...context } });
      console.log('[chatStore:updateChatContext] Updated chat context:', context);
    },

    updatePatientContext: (context: PatientContext | null) => {
      set({ patientContext: context });
      console.log('[chatStore:updatePatientContext] Updated patient context:', context ? 'context provided' : 'context cleared');
    },
  }));

  

  // Helper function to merge messages while preserving order
  function mergeMessages(existing: ThreadMessage[], incoming: ThreadMessage[]): ThreadMessage[] {
    const merged = [...existing];
    for (const message of incoming) {
      const index = merged.findIndex(m => m.id === message.id);
      if (index === -1) {
        merged.push(message);
      } else {
        merged[index] = message;
      }
    }
    return merged.sort((a, b) => a.created_at - b.created_at);
  }

  // Helper to check if a run status is in a terminal state
  function isTerminalState(status: string | undefined): boolean {
    const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
    return !!status && terminalStates.includes(status);
  }

  export const chatStore = useChatStore;
