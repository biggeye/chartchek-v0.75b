// (store/documentStore.ts)

'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Document, DocumentStore, DocumentCategorization } from '@/types/store/document';

// Initialize Supabase client
const supabase = createClient();

// Create document store with Zustand
export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: [],
  fileQueue: [],
  isLoading: false,
  error: null,
  
  // Set documents
  setDocuments: (documents: Document[]) => set({ documents }),
  
  // Set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  // Set error state
  setError: (error: string | null) => set({ error }),
  
  // Fetch documents from Supabase
 // Fetch documents from Supabase
fetchDocuments: async (facilityId?: number): Promise<Document[]> => {
  set({ isLoading: true, error: null });
  try {
    // Build query
    let query = supabase.from('documents').select('*');
    
    // Add facility filter if provided
    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }
    
    // Execute query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    set({ documents: data as Document[], isLoading: false });
    return data as Document[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    set({ error: (error as Error).message, isLoading: false });
    return [];
  }
},
  
  // Fetch documents for the currently selected facility
  fetchDocumentsForCurrentFacility: async (): Promise<Document[]> => {
    try {
      const facilityStore = (await import('./facilityStore')).useFacilityStore.getState();
      const currentFacilityId = facilityStore.currentFacilityId;
      
      if (currentFacilityId) {
        console.log(`Fetching documents for facility: ${currentFacilityId}`);
        return get().fetchDocuments(currentFacilityId);
      }
      console.log('No facility selected, returning empty document list');
      return [];
    } catch (error) {
      console.error('Error fetching documents for current facility:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch documents for facility', isLoading: false });
      return [];
    }
  },
  
  // Add file to queue
  addToFileQueue: (document: Document) => {
    set((state) => ({
      fileQueue: [...state.fileQueue, document]
    }));
  },
  
  // Remove file from queue
  removeFromFileQueue: (document: Document) => {
    set((state) => ({
      fileQueue: state.fileQueue.filter(file => file.document_id !== document.document_id)
    }));
  },
  
  // Get file queue
  getFileQueue: () => {
    return get().fileQueue;
  },
  
  // Upload document to Supabase storage
  uploadDocument: async (file: File, categorization?: DocumentCategorization): Promise<Document | null> => {
    set({ isLoading: true, error: null });
    try {
      // Get current facility ID
      const facilityStore = (await import('./facilityStore')).useFacilityStore.getState();
      const facilityId = facilityStore.currentFacilityId;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const file_name = `${timestamp}_${file.name}`;
      const filePath = `${userId}/${file_name}`;
      console.log('Uploading file:', filePath)
      // Upload file to Supabase storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      console.log('File uploaded successfully, now indexing');
      // Create document record in database
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert([
          {
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            user_id: userId,
            bucket: 'documents',
     //       facility_id: facilityId,
            patient_id: categorization?.patient_id,
            compliance_concern: categorization?.compliance_concern,
            compliance_concern_other: categorization?.compliance_concern_other,
            processing_status: 'pending'
          }
        ])
        .select()
        .single();
      
      if (documentError) throw documentError;
      
      // Refresh documents list
      await get().fetchDocuments(facilityId);
      
      set({ isLoading: false });
      return documentData as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to upload document', isLoading: false });
      return null;
    }
  },
  
  // Upload and process document (enhanced version that integrates with vector embeddings)
  uploadAndProcessDocument: async (file: File, categorization?: DocumentCategorization): Promise<Document | null> => {
    try {
      // First upload the document to storage
      const document = await get().uploadDocument(file, categorization);
      
      if (!document) {
        throw new Error('Failed to upload document');
      }
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to the OpenAI files API using FormData
      const openAIfileResponse = await fetch('/api/openai/files', {
        method: 'POST',
        body: formData
      });
      
      if (!openAIfileResponse.ok) {
        const errorText = await openAIfileResponse.text();
        throw new Error(`Failed to upload file to OpenAI: ${errorText}`);
      }
      
      const openAIfileData = await openAIfileResponse.json();
      
      // Update the document with the OpenAI file ID
      if (openAIfileData.file_id && document.document_id) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            openai_file_id: openAIfileData.file_id,
            processing_status: 'processed'
          })
          .eq('document_id', document.document_id);
          
        if (updateError) {
          console.error('Error updating document with OpenAI file ID:', updateError);
        }
      }
      
      // Return the updated document
      return document;
    } catch (error) {
      console.error('Error in uploadAndProcessDocument:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to process document', isLoading: false });
      return null;
    }
  },
  
  // Update document categorization
  updateDocumentCategorization: async (documentId: string, categorization: DocumentCategorization): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          facility_id: categorization.facility_id,
          patient_id: categorization.patient_id,
          compliance_concern: categorization.compliance_concern,
          compliance_concern_other: categorization.compliance_concern_other
        })
        .eq('document_id', documentId);
      
      if (error) throw error;
      
      // Refresh documents list
      await get().fetchDocumentsForCurrentFacility();
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Error updating document categorization:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update document', isLoading: false });
      return false;
    }
  }
}));

// Initialize facility subscription - moved to a function to avoid circular dependency
export const initDocumentStoreSubscriptions = () => {
  if (typeof window !== 'undefined') {
    // Only run on client-side
    // Import the facility store dynamically to avoid circular dependency
    const { useFacilityStore } = require('./facilityStore');
    
    const unsubscribe = useFacilityStore.subscribe((state: any) => {
      const currentFacilityId = state.currentFacilityId;
      if (currentFacilityId) {
        useDocumentStore.getState().fetchDocumentsForCurrentFacility();
      }
    });
    
    // Return unsubscribe function in case we need to clean up
    return unsubscribe;
  }
  
  // Return a no-op function if not on client
  return () => {};
};

export const documentStore = useDocumentStore;