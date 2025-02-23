// types/store/thread/index.ts
export namespace ThreadStoreTypes {
    export type FileStatus = 
      | 'active' 
      | 'pending_attach' 
      | 'pending_detach' 
      | 'error';
  
    export interface FileMetadata {
      id: string;
      filename: string;
      status: FileStatus;
      error?: string;
      last_updated: Date;
    }
  
    export type ThreadStatus = 
      | 'idle' 
      | 'updating' 
      | 'polling' 
      | 'error';
  
    export interface ThreadState {
      readonly thread_id: string;
      readonly vector_store_id: string;
      current_files: ReadonlyArray<FileMetadata>;
      staged_files: ReadonlyArray<string>;
      status: ThreadStatus;
      error: string | null;
      last_updated: Date;
    }
  
    export interface ThreadActions {
      initializeThread: (
        threadId: string, 
        vectorStoreId: string
      ) => void;
      
      fetchMergedDocuments: (
        threadId: string
      ) => Promise<void>;
      
      toggleStagedFile: (
        fileId: string
      ) => void;
      
      saveFileChanges: (
        threadId: string
      ) => Promise<void>;
      
      clearError: (
        threadId: string
      ) => void;
      
      completePendingOperations: () => () => void;
    }
  
    export interface ThreadError {
      code: number;
      message: string;
      threadId: string;
      timestamp: Date;
    }
  
    export type UseThreadStore = Readonly<{
      threads: ReadonlyArray<ThreadState>;
      currentThreadId: string | null;
      actions: ThreadActions;
    }>;
  
    export type UseThreadActions = () => ThreadActions;
    export type UseCurrentThread = () => ThreadState | undefined;
  }