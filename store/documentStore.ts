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
        openai_file_id: doc.openai_file_id,
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
        processingError: doc.processing_error,
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
  
      // Get a signed URL for the file from Supabase Storage instead of a public URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(file.filePath, 60); // 60 seconds expiration
  
      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('[documentStore] Failed to get signed URL:', signedUrlError);
        throw new Error('Failed to generate signed file URL');
      }
      
      console.log('[documentStore] Got signed URL for file:', file.filePath);
  
      // Fetch the actual file blob from the signed URL.
      const fileResponse = await fetch(signedUrlData.signedUrl);
      if (!fileResponse.ok) {
        console.error('[documentStore] Failed to fetch file from URL. Status:', fileResponse.status);
        throw new Error(`Failed to fetch file from URL: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      const blob = await fileResponse.blob();
      console.log('[documentStore] Successfully fetched file blob. Size:', blob.size);
  
      // Create a new File object from the blob.
      const fileToUpload = new File(
        [blob], 
        file.fileName || 'unknown_file', 
        { type: file.fileType || 'application/octet-stream' }
      );
  
      // Prepare the form data to send to OpenAI.
      const formData = new FormData();
      formData.append('files', fileToUpload);
      formData.append('purpose', 'assistants');
      
      // Since the API route also requires a thread_id, create a temporary one
      // or use a default one for document uploads
      formData.append('thread_id', 'temp-thread-for-document-upload');

      console.log('[documentStore] Sending file to OpenAI API...');
      
      // Send the file to OpenAI.
      const uploadResponse = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[documentStore] API response error:', uploadResponse.status, errorText);
        throw new Error(`API error (${uploadResponse.status}): ${errorText}`);
      }
      
      const uploadData = await uploadResponse.json();
      console.log('[documentStore] Uploaded file response:', uploadData);
  
      // The API now returns file_id directly instead of id for single file uploads
      const openaiFileId = uploadData.file_id || '';
      
      if (!openaiFileId) {
        throw new Error('Failed to get file ID from OpenAI upload response');
      }
  
      // Update the document record in Supabase with the new openai_file_id.
      const { error } = await supabase.from('documents').update({
        openai_file_id: openaiFileId,
        updated_at: new Date().toISOString()
      }).eq('document_id', file.document_id);
  
      if (error) throw error;
      return openaiFileId;
    } catch (error) {
      console.error('[documentStore] Upload failed:', error);
      throw error;
    }
  },
  
  getFileQueue: () => {
    return get().fileQueue;
  },

  uploadDocument: async (file: File): Promise<Document | null> => {
    const store = get();
    try {
      store.setLoading(true);
      store.setError(null);

      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('[documentStore] Uploading file for user:', user.id);
      const filePath = `${user.id}/${file.name}`;

      // Upload to storage bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Prevent overwriting existing files with the same name
        });

      if (storageError) {
        console.error('[documentStore] Storage upload error:', storageError);
        throw new Error(`Failed to upload to storage: ${storageError.message}`);
      }

      console.log('[documentStore] File uploaded to storage successfully:', storageData);

      // Insert document record
      const { data, error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size.toString(),
        bucket: 'documents',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single();

      if (dbError) {
        console.error('[documentStore] Database insert error:', dbError);
        throw new Error(`Failed to create document record: ${dbError.message}`);
      }

      if (!data) {
        throw new Error('No data returned from document insert');
      }

      console.log('[documentStore] Document record created successfully:', data);

      // Add to local state
      await store.fetchDocuments();

      return data ? {
        document_id: data.document_id,
        userId: data.user_id,
        fileName: data.file_name,
        fileType: data.file_type,
        fileSize: Number(data.file_size),
        filePath: data.file_path,
        bucket: data.bucket,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        processingStatus: data.processing_status,
        processingError: data.processing_error,
        openai_file_id: data.openai_file_id,
      } : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      store.setError(errorMessage);
      console.error('[documentStore] Document upload failed:', error);
      return null;
    } finally {
      store.setLoading(false);
    }
  },

  uploadAndProcessDocument: async (file: File): Promise<Document | null> => {
    const store = get();
    let documentRecord: Document | null = null;
    
    try {

      // Step 1: Upload to storage and create DB record
      documentRecord = await store.uploadDocument(file);
      if (!documentRecord) {
        console.error('[documentStore] Upload document returned null');
        throw new Error('Failed to upload document to storage');
      }
      
        // Step 2: Upload to OpenAI
      try {
        // Set status to processing
        const { error: updateError } = await supabase.from('documents').update({
          processing_status: 'processing',
          updated_at: new Date().toISOString()
        }).eq('document_id', documentRecord.document_id);

        if (updateError) {
          console.warn('[documentStore] Failed to update processing status:', updateError);
        }

        // Update local document record
        documentRecord.processingStatus = 'processing';
        
        // Upload to OpenAI
        const openaiFileId = await store.uploadFileToOpenAI(documentRecord);
        console.log('[documentStore] Uploaded file ID:', openaiFileId);
        if (!openaiFileId) {
          throw new Error('No OpenAI file ID returned from upload');
        }
      
        // Update the database with success status
        const { error: finalUpdateError } = await supabase.from('documents').update({
          openai_file_id: openaiFileId,
          processing_status: 'indexed',
          updated_at: new Date().toISOString()
        }).eq('document_id', documentRecord.document_id);
        
        if (finalUpdateError) {
          console.warn('[documentStore] Failed to update final document status:', finalUpdateError);
        }
        
        // Update local record
        documentRecord.openai_file_id = openaiFileId;
        documentRecord.processingStatus = 'indexed';
        
        // Refresh documents to get the updated state
        await store.fetchDocuments();
        
        return documentRecord;
      } catch (openaiError) {
        console.error('[documentStore] OpenAI processing failed:', openaiError);
        
        // Check for specific OpenAI errors that indicate unsupported format
        const errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError);
        const isUnsupportedFormat = 
          errorMessage.includes('unsupported') || 
          errorMessage.includes('format') ||
          errorMessage.includes('file type');
        
        const status = isUnsupportedFormat ? 'unsupported_format' : 'failed';
        
        // Update database with failure status
        const { error: failureUpdateError } = await supabase.from('documents').update({
          processing_status: status,
          processing_error: errorMessage,
          updated_at: new Date().toISOString()
        }).eq('document_id', documentRecord.document_id);
        
        if (failureUpdateError) {
          console.warn('[documentStore] Failed to update document failure status:', failureUpdateError);
        }
        
        // Update local record
        documentRecord.processingStatus = status;
        documentRecord.processingError = errorMessage;
        
        // Refresh documents
        await store.fetchDocuments();
        
        // We still return the document as we successfully stored it
        console.log('[documentStore] Document stored but OpenAI processing failed:', status);
        return documentRecord;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
      store.setError(errorMessage);
      console.error('[documentStore] Document processing failed:', error);
      return null;
    }
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