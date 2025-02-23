// store/threadStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ThreadStoreTypes } from '@/types/store/thread';
import { createClient } from '@/utils/supabase/client';

// Helper function to update the thread row with a new vector_store_id
async function updateThreadVectorStoreInSupabase(threadId: string, vectorStoreId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('chat_threads')
    .update({ vector_store_id: vectorStoreId, updated_at: new Date() })
    .eq('thread_id', threadId);
  if (error) {
    throw new Error(error.message);
  }
}

export const useThreadStore = create<ThreadStoreTypes.UseThreadStore>()(
  immer((set, get) => ({
    threads: [],
    currentThreadId: null,
    actions: {
      initializeThread(threadId, vectorStoreId) {
        console.log('Initializing thread:', { threadId, vectorStoreId });
        set((state) => {
          const exists = state.threads.some(
            (t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId
          );
          if (!exists) {
            console.log('Adding new thread:', { threadId, vectorStoreId });
            state.threads.push({
              thread_id: threadId,
              vector_store_id: vectorStoreId,
              current_files: [],
              staged_files: [],
              status: 'idle',
              error: null,
              last_updated: new Date()
            });
          } else {
            console.log('Thread already exists:', threadId);
          }
          state.currentThreadId = threadId;
          console.log('Current thread ID set to:', state.currentThreadId);
        });
      },

      async fetchMergedDocuments(threadId) {
        console.log('Fetching merged documents for thread:', threadId);
        const thread = get().threads.find(
          (t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId
        );
        if (!thread) return;

        // Set thread status to updating
        set((state) => {
          const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
          t.status = 'updating';
          console.log('Thread status updated to updating:', threadId);
        });

        try {
          let vectorStoreId = thread.vector_store_id;

          // If vector_store_id is missing or temporary, retrieve it via the existing endpoint
          if (!vectorStoreId || vectorStoreId === 'temp-vector-store') {
            console.log('Retrieving vector store ID for thread:', threadId);
            const retrieveRes = await fetch(`/api/threads/${threadId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            if (!retrieveRes.ok) {
              throw new Error(`HTTP ${retrieveRes.status}`);
            }
            const openaiThread = await retrieveRes.json();
            vectorStoreId = openaiThread.tool_resources?.file_search?.vector_store_ids?.[0];

            if (vectorStoreId) {
              // Update local state
              set((state) => {
                const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
                t.vector_store_id = vectorStoreId;
                console.log('Vector store ID updated for thread:', { threadId, vectorStoreId });
              });
              // Use the helper to update the Supabase thread row
              await updateThreadVectorStoreInSupabase(threadId, vectorStoreId);
              console.log('Vector store ID updated in Supabase for thread:', { threadId, vectorStoreId });
            }
          }

          // If still missing, treat as no attached files
          if (!vectorStoreId) {
            set((state) => {
              const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
              t.current_files = [];
              t.status = 'idle';
              t.last_updated = new Date();
              console.log('No vector store ID found for thread:', threadId);
            });
            return;
          }

          // Fetch merged documents using your merged-documents endpoint
          const response = await fetch(`/api/threads/${threadId}/merged-documents`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const { data } = await response.json();

          set((state) => {
            const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
            t.current_files = data.map((f: any) => ({
              id: f.id,
              filename: f.supabase_data?.filename || 'Unknown',
              status: 'active' as ThreadStoreTypes.FileStatus,
              last_updated: new Date(f.created_at * 1000)
            }));
            t.status = 'idle';
            t.last_updated = new Date();
            console.log('Merged documents fetched for thread:', { threadId, data });
          });
        } catch (error) {
          set((state) => {
            const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
            t.status = 'error';
            t.error = error instanceof Error ? error.message : 'Failed to fetch documents';
            console.log('Error fetching merged documents for thread:', { threadId, error });
          });
        }
      },

      toggleStagedFile(fileId) {
        console.log('Toggling staged file:', fileId);
        set((state) => {
          const thread = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === state.currentThreadId);
          if (!thread) return;
          if (thread.staged_files.includes(fileId)) {
            thread.staged_files = thread.staged_files.filter((id: string) => id !== fileId);
            console.log('File removed from staged files:', fileId);
          } else {
            thread.staged_files.push(fileId);
            console.log('File added to staged files:', fileId);
          }
        });
      },

      async saveFileChanges(threadId) {
        console.log('Saving file changes for thread:', threadId);
        const thread = get().threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId);
        if (!thread) return;

        set((state) => {
          const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
          t.status = 'updating';
          console.log('Thread status updated to updating:', threadId);
        });

        try {
          // Implementation: perform API calls to add/remove files as needed.
          // Here, we're just simulating a successful update.
          set((state) => {
            const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
            t.status = 'idle';
            t.last_updated = new Date();
            console.log('File changes saved for thread:', threadId);
          });
        } catch (error) {
          set((state) => {
            const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId)!;
            t.status = 'error';
            t.error = error instanceof Error ? error.message : 'Failed to save changes';
            console.log('Error saving file changes for thread:', { threadId, error });
          });
        }
      },

      clearError(threadId) {
        console.log('Clearing error for thread:', threadId);
        set((state) => {
          const t = state.threads.find((t: ThreadStoreTypes.ThreadState) => t.thread_id === threadId);
          if (t) {
            t.error = null;
            console.log('Error cleared for thread:', threadId);
          }
        });
      },

      completePendingOperations() {
        console.log('Completing pending operations for all threads');
        const interval = setInterval(async () => {
          const updatingThreads = get().threads.filter(
            (t: ThreadStoreTypes.ThreadState) => t.status === 'updating' || t.status === 'polling'
          );
          if (updatingThreads.length === 0) {
            clearInterval(interval);
            return;
          }
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }))
);

// Export typed hooks
export const useThreadActions: ThreadStoreTypes.UseThreadActions = () =>
  useThreadStore((state) => state.actions);

export const useCurrentThread: ThreadStoreTypes.UseCurrentThread = () =>
  useThreadStore((state) =>
    state.threads.find(
      (t: ThreadStoreTypes.ThreadState) => t.thread_id === state.currentThreadId
    )
  );
