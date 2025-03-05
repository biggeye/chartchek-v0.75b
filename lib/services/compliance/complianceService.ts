// lib/services/compliance/complianceService.ts
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { processComplianceDocument, processComplianceDocumentsBatch } from './complianceDataProcessor';
import { queryComplianceDatabase } from './complianceQueryService';
import { 
  getUserComplianceFrameworks, 
  updateUserCompliancePreferences,
  getAllComplianceFrameworks,
  createComplianceFramework,
  ComplianceFramework,
  UserCompliancePreference
} from './complianceFrameworkService';
import { associatePdfWithComplianceFramework } from '../processPdfForEmbeddings';

export interface ComplianceSearchParams {
  userId: string;
  query: string;
  frameworkIds?: number[];
  limit?: number;
  threshold?: number;
}

export interface ComplianceSearchResult {
  id: number;
  document_id: number;
  framework_id: number;
  section_title: string;
  content: string;
  similarity: number;
  framework_name?: string;
  document_title?: string;
}

// Get client for browser context (client-side)
const getClientSideClient = () => {
  return createSupabaseClient();
};

// Get client for server context (using service role key)
const getServerSideClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Comprehensive service for compliance vector database operations
 */
export class ComplianceService {
  private openai;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
    });
  }
  
  /**
   * Search across compliance frameworks based on user preferences
   */
  async searchCompliance(params: ComplianceSearchParams): Promise<ComplianceSearchResult[]> {
    try {
      const { userId, query, frameworkIds, limit = 5, threshold = 0.7 } = params;
      
      // Get user's active frameworks if not provided
      let activeFrameworkIds: number[] = [];
      
      if (frameworkIds && frameworkIds.length > 0) {
        activeFrameworkIds = frameworkIds;
      } else {
        const userFrameworks = await getUserComplianceFrameworks(userId);
        activeFrameworkIds = userFrameworks.map(f => f.framework_id);
      }
      
      // If no active frameworks, return empty results
      if (activeFrameworkIds.length === 0) {
        console.log('No active compliance frameworks for user:', userId);
        return [];
      }
      
      // Check if there's a specific framework selected or if we should query multiple
      let results;
      if (activeFrameworkIds.length === 1) {
        // Query with single framework ID
        results = await queryComplianceDatabase(
          userId,
          query,
          activeFrameworkIds[0],
          limit
        );
      } else {
        // We need to handle multiple frameworks by querying each one separately
        // First, query without framework restriction to get the main results
        const initialResults = await queryComplianceDatabase(
          userId,
          query,
          undefined,
          limit
        );
        
        // Filter results to only include those from active frameworks
        results = initialResults.filter(result => 
          activeFrameworkIds.includes(result.framework_id)
        );
      }
      
      // Enhance results with framework and document names
      const enhancedResults = await this.enhanceSearchResults(results);
      
      return enhancedResults;
    } catch (error) {
      console.error('Error searching compliance data:', error);
      throw error;
    }
  }
  
  /**
   * Add additional metadata to search results
   */
  private async enhanceSearchResults(results: any[]): Promise<ComplianceSearchResult[]> {
    try {
      if (results.length === 0) return [];
      
      // Get unique document and framework IDs
      const documentIds = [...new Set(results.map(r => r.document_id))];
      const frameworkIds = [...new Set(results.map(r => r.framework_id))];
      
      const supabase = getServerSideClient();
      
      // Fetch document titles
      const { data: documents } = await supabase
        .from('compliance_documents')
        .select('id, title')
        .in('id', documentIds);
      
      // Fetch framework names
      const { data: frameworks } = await supabase
        .from('compliance_frameworks')
        .select('id, name')
        .in('id', frameworkIds);
      
      // Create lookup maps
      const docMap = documents?.reduce((map, doc) => {
        map[doc.id] = doc.title;
        return map;
      }, {} as Record<number, string>) || {};
      
      const frameworkMap = frameworks?.reduce((map, fw) => {
        map[fw.id] = fw.name;
        return map;
      }, {} as Record<number, string>) || {};
      
      // Enhance results
      return results.map(result => ({
        ...result,
        framework_name: frameworkMap[result.framework_id] || 'Unknown Framework',
        document_title: docMap[result.document_id] || 'Unknown Document'
      }));
    } catch (error) {
      console.error('Error enhancing search results:', error);
      return results;
    }
  }
  
  /**
   * Get all available compliance frameworks
   */
  async getAllFrameworks(): Promise<ComplianceFramework[]> {
    return getAllComplianceFrameworks();
  }
  
  /**
   * Update a user's compliance framework preferences
   */
  async updateUserPreferences(userId: string, frameworkIds: number[], active: boolean = true): Promise<{ added: number; updated: number }> {
    return updateUserCompliancePreferences(userId, frameworkIds, active);
  }
  
  /**
   * Add a new compliance document and associate it with a framework
   */
  async addComplianceDocument(document: any, frameworkId: number): Promise<boolean> {
    return processComplianceDocument({
      title: document.title,
      frameworkId,
      content: document.content,
      source: document.source,
      documentType: document.documentType,
      publishDate: document.publishDate
    });
  }
  
  /**
   * Associate an existing PDF document with a compliance framework
   */
  async associateDocumentWithFramework(documentId: string, frameworkId: number): Promise<boolean> {
    return associatePdfWithComplianceFramework(documentId, frameworkId);
  }
  
  /**
   * Create a new compliance framework
   */
  async createFramework(name: string, description: string): Promise<ComplianceFramework | null> {
    return createComplianceFramework(name, description);
  }
  
  /**
   * Get user's active compliance frameworks
   */
  async getUserFrameworks(userId: string): Promise<UserCompliancePreference[]> {
    return getUserComplianceFrameworks(userId);
  }
}

// Export a singleton instance
export const complianceService = new ComplianceService();
