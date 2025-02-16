import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Tool, ToolResources } from '@/types/api/openai/tools';
import { ProcessingStatus } from '@/types/database';
import { Document } from '@/types/database';

interface DocumentStoreState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fileQueue: string[];
}

interface ThreadAttachment {
  file_id: string;
  tools: string;
}

interface DocumentStore extends DocumentStoreState {
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, threadId?: string) => Promise<string>;
  createVectorStore: (fileId: string) => Promise<void>;
  setVectorStoreId: (documentId: string, vectorStoreId: string) => void;
  checkVectorStoreStatus: (documentId: string) => Promise<void>;
  addToFileQueue: (fileId: string, threadId: string) => void;
  clearFileQueue: () => void;
  getFileQueue: () => string[];
  createNewThread: (attachments: ThreadAttachment[]) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<Document>;
}

const initialState: DocumentStoreState = {
  documents: [],
  isLoading: false,
  error: null,
  fileQueue: [],
};

const supabase = createClient();

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

  createVectorStore: async (fileId: string) => {
    if (!fileId) {
      console.error('Missing fileId or userId');
      return;
    }
    try {
      const response = await fetch('/api/file/create-vector-store', {
        method: 'POST',
        body: JSON.stringify({ fileId }),
      });
      if (!response.ok) {
        throw new Error('Failed to create vector store');
      }
      const vectorStoreFile = await response.json();
      console.log(vectorStoreFile);
      return vectorStoreFile;
    } catch (error) {
      console.error('Error retrieving file:', error);
    }
  },

  setVectorStoreId: (fileId: string, vectorStoreId: string) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.file_id === fileId ? { ...doc, vector_store_id: vectorStoreId } : doc
      ),
    }));
  },

  checkVectorStoreStatus: async (documentId) => {
    // Placeholder for checking vector store status
    console.log('Checking vector store status for document:', documentId);
  },

  createNewThread: async (attachments) => {
    try {
      console.log('[ThreadCreation] Creating new thread with attachments:', attachments);
      // Logic to create a new thread with the given attachments
      // This could involve calling an API endpoint or interacting with a service
      // For example:
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attachments }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new thread');
      }

      const result = await response.json();
      console.log('[ThreadCreation] New thread created:', result);
    } catch (error) {
      console.error('[ThreadCreation] Error creating new thread:', error);
    }
  },

  updateDocument: async (documentId: string, updates: Partial<Document>) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select();

      if (error) throw error;
      
      set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === documentId ? { ...doc, ...data[0] } : doc
        )
      }));
      
      return data[0];
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
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
