// store/geminiCorpusStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  MetadataFilter, 
  QueryResponse, 
  Corpus, 
  Document, 
  Chunk 
} from '@/lib/gemini/corpus';

interface GeminiStore {
  // Corpus state
  corpora: Corpus[];
  currentCorpusName: string | null;
  
  // Document state
  documents: Document[];
  currentDocumentName: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // State setters
  setCorpora: (corpora: Corpus[]) => void;
  setCurrentCorpus: (corpusName: string) => void;
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (documentName: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Corpus API methods
  createCorpus: (displayName: string) => Promise<Corpus | null>;
  queryCorpus: (
    query: string,
    metadataFilters?: MetadataFilter[],
    resultsCount?: number
  ) => Promise<QueryResponse | null>;
  
  // Document API methods
  createDocument: (document: Document) => Promise<Document | null>;
  getDocument: (documentName: string) => Promise<Document | null>;
  listDocuments: (pageSize?: number, pageToken?: string) => Promise<{documents: Document[], nextPageToken?: string} | null>;
  deleteDocument: (documentName: string) => Promise<boolean>;
  queryDocument: (
    documentName: string,
    query: string,
    metadataFilters?: MetadataFilter[],
    resultsCount?: number
  ) => Promise<QueryResponse | null>;
  
  // Chunk API methods
  createChunk: (chunk: Chunk) => Promise<Chunk | null>;
  batchCreateChunks: (chunks: Chunk[]) => Promise<{chunks: Chunk[]} | null>;
}

export const useGeminiStore = create<GeminiStore>()(
  persist(
    (set, get) => ({
      // Initial state
      corpora: [],
      currentCorpusName: null,
      documents: [],
      currentDocumentName: null,
      isLoading: false,
      error: null,
      
      // State setters
      setCorpora: (corpora: Corpus[]) => set({ corpora }),
      setCurrentCorpus: (corpusName: string) => set({ currentCorpusName: corpusName }),
      setDocuments: (documents: Document[]) => set({ documents }),
      setCurrentDocument: (documentName: string) => set({ currentDocumentName: documentName }),
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      
      // Corpus API methods
      createCorpus: async (displayName: string): Promise<Corpus | null> => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/corpus/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create corpus');
          }
          
          const corpus = await response.json();
          set(state => ({ 
            corpora: [...state.corpora, corpus],
            currentCorpusName: corpus.name,
            isLoading: false 
          }));
          
          return corpus;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      queryCorpus: async (
        query: string,
        metadataFilters?: MetadataFilter[],
        resultsCount?: number
      ): Promise<QueryResponse | null> => {
        const { currentCorpusName } = get();
        if (!currentCorpusName) {
          set({ error: 'No corpus selected' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/corpus/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              corpusName: currentCorpusName,
              query,
              metadataFilters,
              resultsCount
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to query corpus');
          }
          
          const results = await response.json();
          set({ isLoading: false });
          return results;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      // Document API methods
      createDocument: async (document: Document): Promise<Document | null> => {
        const { currentCorpusName } = get();
        if (!currentCorpusName) {
          set({ error: 'No corpus selected' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/document/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              corpusName: currentCorpusName,
              document
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create document');
          }
          
          const createdDocument = await response.json();
          set(state => ({ 
            documents: [...state.documents, createdDocument],
            currentDocumentName: createdDocument.name,
            isLoading: false 
          }));
          
          return createdDocument;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      getDocument: async (documentName: string): Promise<Document | null> => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/gemini/document/get?documentName=${encodeURIComponent(documentName)}`, {
            method: 'GET'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get document');
          }
          
          const document = await response.json();
          set({ isLoading: false });
          return document;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      listDocuments: async (pageSize?: number, pageToken?: string): Promise<{documents: Document[], nextPageToken?: string} | null> => {
        const { currentCorpusName } = get();
        if (!currentCorpusName) {
          set({ error: 'No corpus selected' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          let url = `/api/gemini/document/list?corpusName=${encodeURIComponent(currentCorpusName)}`;
          if (pageSize) url += `&pageSize=${pageSize}`;
          if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
          
          const response = await fetch(url, {
            method: 'GET'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to list documents');
          }
          
          const result = await response.json();
          set(state => ({ 
            documents: result.documents,
            isLoading: false 
          }));
          
          return result;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      deleteDocument: async (documentName: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/gemini/document/delete?documentName=${encodeURIComponent(documentName)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete document');
          }
          
          set(state => ({ 
            documents: state.documents.filter(doc => doc.name !== documentName),
            currentDocumentName: state.currentDocumentName === documentName ? null : state.currentDocumentName,
            isLoading: false 
          }));
          
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },
      
      queryDocument: async (
        documentName: string,
        query: string,
        metadataFilters?: MetadataFilter[],
        resultsCount?: number
      ): Promise<QueryResponse | null> => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/document/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentName,
              query,
              metadataFilters,
              resultsCount
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to query document');
          }
          
          const results = await response.json();
          set({ isLoading: false });
          return results;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      // Chunk API methods
      createChunk: async (chunk: Chunk): Promise<Chunk | null> => {
        const { currentDocumentName } = get();
        if (!currentDocumentName) {
          set({ error: 'No document selected' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/chunk/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentName: currentDocumentName,
              chunk
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create chunk');
          }
          
          const createdChunk = await response.json();
          set({ isLoading: false });
          return createdChunk;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },
      
      batchCreateChunks: async (chunks: Chunk[]): Promise<{chunks: Chunk[]} | null> => {
        const { currentDocumentName } = get();
        if (!currentDocumentName) {
          set({ error: 'No document selected' });
          return null;
        }
        
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gemini/chunk/batch-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentName: currentDocumentName,
              chunks
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to batch create chunks');
          }
          
          const result = await response.json();
          set({ isLoading: false });
          return result;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      }
    }),
    {
      name: 'gemini-corpus-storage'
    }
  )
);