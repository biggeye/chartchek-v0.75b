import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Tool, ToolResources } from '@/types/api/openai/tools';
import { ProcessingStatus } from '@/types/database';

interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_id: string;
  vector_store_id?: string;
}

interface DocumentStoreState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fileQueue: File[];
}

interface DocumentStore extends DocumentStoreState {
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  checkVectorStoreStatus: (documentId: string) => Promise<void>;
  addToFileQueue: (file: File) => void;
  clearFileQueue: () => void;
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

  addToFileQueue: (file) => set((state) => ({
    fileQueue: [...state.fileQueue, file],
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

  uploadDocument: async (file) => {
    // Placeholder for upload logic
    console.log('Uploading document:', file);
  },

  checkVectorStoreStatus: async (documentId) => {
    // Placeholder for checking vector store status
    console.log('Checking vector store status for document:', documentId);
  },
}));
