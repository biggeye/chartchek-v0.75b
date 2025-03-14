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
  fetchDocuments: async (facilityId?: string): Promise<Document[]> => {
    set({ isLoading: true, error: null });
    try {
      // Build query
      let query = supabase.from('documents').select('*');
      
      // Add facility filter if provided
      if (facilityId) {
        // Check if the facilityId is a valid UUID before using it in the query
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(facilityId)) {
          query = query.eq('facility_id', facilityId);
        } else {
          console.warn(`Invalid UUID format for facility_id: ${facilityId}. Fetching all documents instead.`);
        }
      }
      
      // Execute query
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ documents: data as Document[], isLoading: false });
      return data as Document[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch documents', isLoading: false });
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
      
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const file_name = `${timestamp}_${file.name}`;
      const filePath = `${facilityId || 'general'}/${file_name}`;
      
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
            filePath,
            file_name: file.name,
            fileType: file.type,
            fileSize: file.size,
            facility_id: facilityId,
            patient_id: categorization?.patient_id,
            compliance_concern: categorization?.compliance_concern,
            compliance_concern_other: categorization?.compliance_concern_other,
            processingStatus: 'pending'
          }
        ])
        .select()
        .single();
      
      if (documentError) throw documentError;
      
      // Refresh documents list
      await get().fetchDocuments(facilityId || undefined);
      
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
      
      // TODO: Process document with vector embeddings
      // This would integrate with the vectorChek service
      
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