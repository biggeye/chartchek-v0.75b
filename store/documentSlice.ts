"use client";

import type { Document } from '@/types/store'; // Adjust the import path as necessary

const createDocumentSlice = (set: any, get: any) => ({ // State: Array to hold document objects, active document ID, and an error state documents: [] as Document[], activeDocumentId: null as string | null, error: null as string | null,

// Action: Add a document to the state addDocument: (doc: Document) => set((state: any) => ({ documents: [...state.documents, doc] })),

// Action: Remove a document from the state by its ID removeDocument: (id: string) => set((state: any) => ({ documents: state.documents.filter((doc: Document) => doc.id !== id) })),

// Action: Update a document with partial changes by its ID updateDocument: (id: string, updatedDoc: Partial) => set((state: any) => ({ documents: state.documents.map((doc: Document) => doc.id === id ? { ...doc, ...updatedDoc } : doc ) })),

// Action: Set the currently active document's ID setActiveDocument: (id: string) => set({ activeDocumentId: id }),

// Async action: Fetch documents from your API (or Supabase) fetchDocuments: async () => { try { // Replace '/api/documents' with your actual document fetching endpoint if necessary const response = await fetch('/api/documents'); if (!response.ok) { throw new Error(Failed to fetch documents: ${response.statusText}); } const json = await response.json(); // Expect the API to return data in the shape: { data: Document[] } set({ documents: json.data || [], error: null }); } catch (error: any) { console.error("Error fetching documents:", error); set({ error: error.message }); } } });

})
export default createDocumentSlice;