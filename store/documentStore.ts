//documentStore.ts
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
  addToFileQueue: (file: Document) => set((state) => ({
    fileQueue: [...state.fileQueue, file]
  })),
  removeFromFileQueue: (file: Document) => set((state) => ({
    fileQueue: state.fileQueue.filter((item) => item.document_id !== file.document_id)
  })),

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
  uploadFileToOpenAI: async (file: Document): Promise<string> => {
    try {
      if (!file.filePath?.trim()) {
        throw new Error('Invalid document: missing file path');
      }
  
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(file.filePath);
  
      if (!urlData?.publicUrl) throw new Error('Failed to generate file URL');
  
      const formData = new FormData();
      formData.append('files', new File([urlData.publicUrl], file.filePath));
      formData.append('purpose', 'assistants');
  
      const uploadResponse = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
  
      const uploadData = await uploadResponse.json();
      console.log('[documentStore] Uploaded file IDs:', uploadData);
      const { error } = await supabase.from('documents').update({
        openai_file_id: uploadData.file_id,
        updated_at: new Date().toISOString()
      }).eq('document_id', file.document_id);
  
      if (error) throw error;
      return uploadData.file_id;
    } catch (error) {
      console.error('[documentStore] Upload failed:', error);
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