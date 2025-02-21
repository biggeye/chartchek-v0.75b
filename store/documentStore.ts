import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { DocumentStoreState, DocumentMetadata, Document, DocumentStore } from '@/types/store/document';

const initialState: DocumentStoreState = {
  documents: [],
  isLoading: false,
  error: null,
  fileQueue: [],
};

const supabase = createClient();

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...initialState,

  setDocuments: (documents: Document[]) => set({ documents }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),


  fetchDocuments: async () => {
    const store = get();
    try {
      store.setLoading(true);
      store.setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*');

      if (error) throw error;

      const documents = data.map(doc => ({
        document_id: doc.document_id,
        bucket: doc.bucket,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        userId: doc.user_id,
        processingStatus: doc.processing_status,
        metadata: doc.metadata
      }));

      set({ documents });
      return documents;
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to fetch documents');
      return [];
    } finally {
      store.setLoading(false);
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
