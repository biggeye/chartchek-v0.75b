// hooks/useGemini.ts

import { useState } from 'react';
import { 
  Corpus, 
  QueryResponse, 
  MetadataFilter, 
  Document, 
  Chunk 
} from '@/lib/gemini/corpus';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Corpus methods
  const createCorpus = async (displayName: string): Promise<Corpus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/corpus/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create corpus');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to create corpus');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const queryCorpus = async (
    corpusName: string,
    query: string,
    metadataFilters?: MetadataFilter[],
    resultsCount?: number
  ): Promise<QueryResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/corpus/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corpusName,
          query,
          metadataFilters,
          resultsCount
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to query corpus');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to query corpus');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Document methods
  const createDocument = async (
    corpusName: string,
    document: Document
  ): Promise<Document | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/document/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corpusName,
          document
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to create document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDocument = async (documentName: string): Promise<Document | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/gemini/document/get?documentName=${encodeURIComponent(documentName)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get document');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to get document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const listDocuments = async (
    corpusName: string,
    pageSize?: number,
    pageToken?: string
  ): Promise<{ documents: Document[]; nextPageToken?: string } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `/api/gemini/document/list?corpusName=${encodeURIComponent(corpusName)}`;
      if (pageSize) url += `&pageSize=${pageSize}`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
      
      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list documents');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to list documents');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (documentName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/gemini/document/delete?documentName=${encodeURIComponent(documentName)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Failed to delete document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const queryDocument = async (
    documentName: string,
    query: string,
    metadataFilters?: MetadataFilter[],
    resultsCount?: number
  ): Promise<QueryResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/document/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName,
          query,
          metadataFilters,
          resultsCount
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to query document');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to query document');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Chunk methods
  const createChunk = async (
    documentName: string,
    chunk: Chunk
  ): Promise<Chunk | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/chunk/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName,
          chunk
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chunk');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to create chunk');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const batchCreateChunks = async (
    documentName: string,
    chunks: Chunk[]
  ): Promise<{ chunks: Chunk[] } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini/chunk/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName,
          chunks
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to batch create chunks');
      }
      
      return await response.json();
    } catch (error: any) {
      setError(error.message || 'Failed to batch create chunks');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    // Corpus methods
    createCorpus,
    queryCorpus,
    // Document methods
    createDocument,
    getDocument,
    listDocuments,
    deleteDocument,
    queryDocument,
    // Chunk methods
    createChunk,
    batchCreateChunks
  };
}