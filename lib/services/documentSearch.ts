// lib/services/documentSearch.ts
import { getOpenAIClient } from '@/utils/openai/server';
import { createServer } from '@/utils/supabase/server';

export interface DocumentSearchResult {
  id: string;
  title: string;
  content: string;
  document_type?: string;
  created_at?: string;
  similarity: number;
}

export interface SearchOptions {
  limit?: number;
  documentTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  frameworkIds?: number[];
}

export async function searchDocuments(
  query: string, 
  options: SearchOptions = {}
): Promise<DocumentSearchResult[]> {
  try {
    const {
      limit = 5,
      documentTypes,
      startDate,
      endDate,
      frameworkIds
    } = options;
    
    const supabase = await createServer();
    
    const openai = getOpenAIClient();

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error('Failed to generate embedding for search query');
    }
    
    const [responseData] = embeddingResponse.data;
    const embedding = responseData.embedding;
    
    // Build search parameters
    const searchParams: any = {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit
    };
    
    // Add optional filters
    if (documentTypes && documentTypes.length > 0) {
      searchParams.document_types = documentTypes;
    }
    
    if (startDate) {
      searchParams.start_date = startDate.toISOString();
    }
    
    if (endDate) {
      searchParams.end_date = endDate.toISOString();
    }
    
    if (frameworkIds && frameworkIds.length > 0) {
      searchParams.framework_ids = frameworkIds;
    }
    
    // Perform vector similarity search
    const { data, error: dataError } = await supabase.rpc('match_document_embeddings', searchParams);
    
    if (dataError) {
      throw dataError;
    }
    
    return data || [];
  } catch (dataError) {
    console.error('Document search failed:', dataError);
    return [];
  }
}

// Add a function to search specifically for compliance documents
export async function searchComplianceDocuments(
  query: string,
  userId: string,
  options: SearchOptions = {}
): Promise<DocumentSearchResult[]> {
  try {
    // Get user's active compliance frameworks if not specified
    if (!options.frameworkIds || options.frameworkIds.length === 0) {
      const supabase = await createServer();
      
      const { data } = await supabase
        .from('user_compliance_preferences')
        .select('framework_id')
        .eq('user_id', userId)
        .eq('is_active', true);
        
      options.frameworkIds = (data || []).map((p: { framework_id: number }) => p.framework_id);
      
      if (!options.frameworkIds || options.frameworkIds.length === 0) {
        return [];
      }
    }
    
    // Set document type to compliance
    if (!options.documentTypes) {
      options.documentTypes = ['compliance'];
    }
    
    return searchDocuments(query, options);
  } catch (error) {
    console.error('Compliance document search failed:', error);
    return [];
  }
}

// Add a function to get document by ID
export async function getDocumentById(documentId: string): Promise<DocumentSearchResult | null> {
  try {
    const supabase = await createServer();
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId) 
      .single();
      
    if (error) {
      throw error;
    }
    
    return data as DocumentSearchResult | null;
  } catch (error) {
    console.error('Failed to get document by ID:', error);
    return null;
  }
}