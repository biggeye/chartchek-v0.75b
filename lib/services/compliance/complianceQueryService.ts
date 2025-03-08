// lib/services/complianceQueryService.ts
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { useOpenAI } from '@/lib/contexts/OpenAIProvider';

interface QueryResult {
  id: number;
  document_id: number;
  framework_id: number;
  section_title: string;
  content: string;
  similarity: number;
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

export async function queryComplianceDatabase(
  userId: string,
  query: string,
  frameworkId?: number, // Optional - if not provided, will use user's active frameworks
  limit: number = 5
): Promise<QueryResult[]> {
  try {
    const supabase = getServerSideClient();
    
    const { openai, isLoading, error } = useOpenAI()
    
    // Determine which frameworks to query
    let frameworkIds: number[] = [];
    
    if (frameworkId) {
      // If a specific framework is provided, use only that
      frameworkIds = [frameworkId];
    } else {
      // Otherwise, get the user's active frameworks
      const { data: userPrefs } = await supabase
        .from('user_compliance_preferences')
        .select('framework_id')
        .eq('user_id', userId)
        .eq('is_active', true);
        
      frameworkIds = (userPrefs || []).map(pref => pref.framework_id);
    }
    
    if (frameworkIds.length === 0) {
      console.log('No active frameworks for user:', userId);
      return [];
    }
    
    // Generate embedding for the query
    const embedding = await openai!.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    
    const queryEmbedding = embedding.data[0].embedding;
    
    // Query the database using the embedding
    let { data: results, error: resultsError } = await supabase
      .rpc('match_compliance_sections', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit || 5,
        framework_ids: frameworkIds
      });
      
    if (resultsError) {
      console.error('Error querying compliance database:', error);
      return [];
    }
    
    return results || [];
  } catch (error) {
    console.error('Error in queryComplianceDatabase:', error);
    return [];
  }
}

// Call this to route a user query to the appropriate compliance LLM with context
export async function getComplianceAssistance(
  userId: string,
  userQuery: string,
  frameworkId?: number
): Promise<string> {
  try {
    const { openai, isLoading, error } = useOpenAI()

    
    // Get relevant compliance sections
    const complianceResults = await queryComplianceDatabase(userId, userQuery, frameworkId);
    
    // If no results, return generic response
    if (!complianceResults || complianceResults.length === 0) {
      return "I don't have specific compliance information for your query. Please try another question or select a different compliance framework.";
    }
    
    // Format compliance context
    const complianceContext = complianceResults
      .map((result, index) => `[${index + 1}] ${result.section_title}:\n${result.content}`)
      .join('\n\n');
    
    // Generate a response
    const completion = await openai!.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a compliance assistant. Answer the user's question based on the provided compliance frameworks and regulations. Cite specific sections when relevant." },
        { role: "user", content: `Based on the following compliance information:\n\n${complianceContext}\n\nPlease answer: ${userQuery}` }
      ],
    });
    
    return completion.choices[0].message.content || "I couldn't generate a response for your compliance query.";
  } catch (error) {
    console.error('Error in getComplianceAssistance:', error);
    return "An error occurred while processing your compliance query. Please try again later.";
  }
}

// Add a new function to get all compliance frameworks
export async function getAllComplianceFrameworks() {
  try {
    const supabase = getClientSideClient();
    
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .order('name');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get compliance frameworks:', error);
    return [];
  }
}

// Add a function to provide contextual compliance information to Assistant API
export async function getComplianceContextForAssistant(
  userId: string,
  userQuery: string,
  maxResults: number = 5
): Promise<string> {
  try {
    // Get relevant compliance sections
    const results = await queryComplianceDatabase(userId, userQuery, undefined, maxResults);
    
    // If no results, return empty string
    if (!results || results.length === 0) {
      return "";
    }
    
    // Format compliance context
    const complianceContext = results
      .map((result, index) => {
        return `[Section ${index + 1}] ${result.section_title || 'Untitled Section'}\n${result.content}`;
      })
      .join('\n\n');
    
    return complianceContext;
  } catch (error) {
    console.error('Error getting compliance context:', error);
    return "";
  }
}