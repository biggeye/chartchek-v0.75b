// store/documentStore.ts

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';
import { Document, DocumentCategorization, DocumentStoreState } from '@/types/store/document';
// Initialize Supabase client
const supabase = createClient();

// Create enhanced document store with Zustand
export const useDocumentStore = create<DocumentStoreState>()(
  persist(
    (set, get) => ({
      documents: [],
      isLoadingDocuments: false,
      error: null,

      // Original methods
      setDocuments: (documents: Document[]) => set({ documents }),
      setIsLoadingDocuments: (isLoadingDocuments: boolean) => set((state) => ({ ...state, isLoadingDocuments})),
      setError: (error: string | null) => set({ error }),

      fetchDocuments: async (facilityId?: number): Promise<Document[]> => {
        // Only fetch if documents array is empty
        if (get().documents.length > 0 && !facilityId) {
          return get().documents;
        }
        
        set({ isLoadingDocuments: true, error: null });
        try {
          // Build query
          let query = supabase.from('documents').select('*');
          
          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          if (facilityId){
            const filteredData = data.filter(doc => doc.facility_id === facilityId);
            set({ documents: filteredData as Document[], isLoadingDocuments: false });
            return filteredData as Document[];
          }
          set({ documents: data as Document[], isLoadingDocuments: false });
          return data as Document[];
        } catch (error) {
          console.error('Error fetching documents:', error);
          set({ error: (error as Error).message, isLoadingDocuments: false });
          return [];
        }
      },

      fetchDocumentsForCurrentFacility: async (): Promise<Document[]> => {
        try {
          const facilityStore = (await import('../patient/facilityStore')).useFacilityStore.getState();
          const currentFacilityId = facilityStore.currentFacilityId;

          if (currentFacilityId) {

            return get().fetchDocuments(currentFacilityId);
          }
  
          return [];
        } catch (error) {
          console.error('Error fetching documents for current facility:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to fetch documents for facility', isLoadingDocuments: false });
          return [];
        }
      },
      // Document upload and processing methods
      uploadDocument: async (file: File, categorization?: DocumentCategorization): Promise<Document | null> => {
        set({ isLoadingDocuments: true, error: null });
        try {
          // Get current facility ID
          const facilityStore = (await import('../patient/facilityStore')).useFacilityStore.getState();
          const facilityId = facilityStore.currentFacilityId;
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          const userId = user?.id;

          // Generate a unique file path
          const timestamp = new Date().getTime();
          const file_name = `${timestamp}_${file.name}`;
          const filePath = `${userId}/${file_name}`;
 

          // Upload file to Supabase storage
          const { data: fileData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;


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

          set({ isLoadingDocuments: false });
          return documentData as Document;
        } catch (error) {
          console.error('Error uploading document:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to upload document', isLoadingDocuments: false });
          return null;
        }
      },

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
          set({ error: error instanceof Error ? error.message : 'Failed to process document', isLoadingDocuments: false });
          return null;
        }
      },

      updateDocumentCategorization: async (documentId: string, categorization: DocumentCategorization): Promise<boolean> => {
        set({ isLoadingDocuments: true, error: null });
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

          set({ isLoadingDocuments: false });
          return true;
        } catch (error) {
          console.error('Error updating document categorization:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update document', isLoadingDocuments: false });
          return false;
        }
      },

    }),
    {
      name: 'documentStore',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

// Initialize facility subscription - moved to a function to avoid circular dependency
export const initDocumentStoreSubscriptions = () => {
  if (typeof window !== 'undefined') {
    // Only run on client-side
    // Import the facility store dynamically to avoid circular dependency
    const { useFacilityStore } = require('../patient/facilityStore');

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
  return () => { };
};

export default useDocumentStore;