import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Tool, ToolResources } from '@/types/api/openai/tools';
import { ProcessingStatus } from '@/types/database';

interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type?: string;
  file_id: string;
  vector_store_id?: string;
}

interface DocumentStoreState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fileQueue: string[];
}

interface DocumentStore extends DocumentStoreState {
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, threadId?: string) => Promise<string>;
  checkVectorStoreStatus: (documentId: string) => Promise<void>;
  addToFileQueue: (fileId: string, threadId: string) => void;
  clearFileQueue: () => void;
  getFileQueue: () => string[];
}

const initialState: DocumentStoreState = {
  documents: [],
  isLoading: false,
  error: null,
  fileQueue: [],
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...initialState,

  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document],
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addToFileQueue: (fileId: string, threadId: string) => set((state) => ({
    fileQueue: [...state.fileQueue, fileId],
  })),

  clearFileQueue: () => set({ fileQueue: [] }),

  fetchDocuments: async () => {
    const store = get();
    try {
      store.setLoading(true);
      store.setError(null);

      const supabase = createClient();
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*');

      if (error) throw error;

      store.setDocuments(documents ?? []);
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      store.setLoading(false);
    }
  },

  uploadDocument: async (file: File, threadId?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Extract file extension
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop();
      formData.append('file_type', fileExtension || '');
      formData.append('thread_id', threadId || '');

      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return data.file_id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  createVectorStore: async (fileId: string, threadId: string) => {
    try {
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('thread_id', threadId);

      const response = await fetch('/api/thread/message', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return data.file_id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  checkVectorStoreStatus: async (documentId) => {
    // Placeholder for checking vector store status
    console.log('Checking vector store status for document:', documentId);
  },

  getFileQueue: () => {
    return get().fileQueue;
  },
}));

export const documentStore = useDocumentStore;
export const getFileQueue = () => documentStore.getState().fileQueue;

async function fetchDocumentsCount(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact' })

  if (error) throw error;
  return data?.length ?? 0;
}

export { fetchDocumentsCount };
