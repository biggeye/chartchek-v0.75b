
import { P } from "@upstash/redis/zmscore-BdNsMd17";
import { getGoogleAccessToken } from "../google/getAccessToken";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
import { KnowledgeDocument, KnowledgeDocumentMetadata, Corpus, } from "@/types/store/knowledgeBase";
// Existing interfaces (MetadataFilter, Corpus, RelevantChunk, QueryResponse, Document, Chunk) - keep these as they are

class GeminiCorpusService {
  private apiKey: string;

  constructor(apiKey: string = GOOGLE_API_KEY || '') {
    this.apiKey = apiKey;
  }

  private async getAuthHeaders() {
    try {
      const accessToken = await getGoogleAccessToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      throw new Error('Failed to get authentication headers');
    }
  }

  async createCorpus(name: string, displayName: string): Promise<Corpus> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${GEMINI_API_BASE}/corpora?key=${this.apiKey}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            displayName, // Replace with your actual project ID
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.error === 'object'
            ? JSON.stringify(errorData.error)
            : (errorData.error || 'Failed to create corpus')
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating corpus:', error);
      throw error;
    }
  }

  async queryCorpus(
    corpusName: string,
    query: string,
    accessToken: string,
    metadataFilters?: any,
    resultsCount: number = 10
  ): Promise<any> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/corpora/${corpusName}:query?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            query,
            metadataFilters,
            resultsCount: Math.min(resultsCount, 100) // API limit is 100
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to query corpus');
      }

      return await response.json();
    } catch (error) {
      console.error('Error querying corpus:', error);
      throw error;
    }
  }

  async listCorpora() {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/corpora?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list corpora');
      }
      return await response.json();
    } catch (error) {
      console.error('Error listing corpora:', error);
      throw error;
    }
  }

  async getCorpus(corpusName: string) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/corpora/${corpusName}/*?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get corpus');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting corpus:', error);
      throw error;
    }
  }

  async patchCorpus(corpusName: string, updateMask: string) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/corpora/${corpusName}?updateMask=user.displayName,${updateMask}`,
        {
          method: 'PATCH',
          headers: await this.getAuthHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update corpus');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating corpus: ', error);
      throw error;
    }
  }

  async deleteCorpus(corpusName: string) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/corpora/${corpusName}?force=true`, // Fixed URL format
        {
          method: 'DELETE',
          headers: await this.getAuthHeaders(),
        }
      );
  
      if (!response.ok) {
        // Handle non-JSON responses safely
        const text = await response.text();
        let errorMessage = 'Failed to delete corpus';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text or status
          errorMessage = text || `HTTP error ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      // For successful DELETE, don't try to parse response if empty
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (error) {
      console.error('Error deleting corpus: ', error);
      throw error;
    }
  }

  /*
    ___________________DOCUMENT SERVICE________
    */
  // Remaining methods (createDocument, getDocument, listDocuments, updateDocument, deleteDocument, queryDocument, createChunk, batchCreateChunks) - update these to accept the accessToken parameter and use the getAuthHeaders() method for authentication
  // Example update for createDocument:
  async createDocument(corpusName: string, document: KnowledgeDocument): Promise<KnowledgeDocument> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${corpusName}/documents?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders(), // Use the updated auth headers
          body: JSON.stringify(document),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  // Add these methods to the GeminiCorpusService class in lib/gemini/corpus.ts

  // Delete a document
  async deleteDocument(documentName: string): Promise<void> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${documentName}?key=${this.apiKey}`,
        {
          method: 'DELETE',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete document: ${errorData.error?.message || response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  // Get a document
  async getDocument(documentName: string): Promise<KnowledgeDocument> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${documentName}?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get document: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in getDocument:', error);
      throw error;
    }
  }

  // List documents in a corpus
  async listDocuments(
    corpusName: string,
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{ documents: KnowledgeDocument[], nextPageToken?: string }> {
    try {
      let url = `${GEMINI_API_BASE}/${corpusName}/documents?pageSize=${pageSize}&key=${this.apiKey}`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: await this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to list documents: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in listDocuments:', error);
      throw error;
    }
  }

  // Query a document
  async queryDocument(
    documentName: string,
    query: string,
    metadataFilters?: any,
    resultsCount: number = 10
  ): Promise<any> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${documentName}:query?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify({
            query,
            metadataFilters,
            resultsCount
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to query document: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in queryDocument:', error);
      throw error;
    }
  }
}

export const geminiCorpusService = new GeminiCorpusService();