import { createClient } from '@/utils/supabase/client';
import { getOpenAIClient } from '@/utils/openai/server'

import { useStreamStore } from '@/store/streamStore';
import { ChatMessage, ChatThread } from '@/types/database';
import { ThreadRun } from '@/types/store/stream';
import { Thread, RunStatusResponse } from '@/types/store/chat';
import { StreamingState } from '@/types/store/stream';


const supabase = createClient();
const userId = async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || '';
}



export interface UserThreadData {
  threads: ChatThread[];
  runs: ThreadRun[];
}

// Helper function to ensure valid ISO date string
const formatDateField = (dateField: string | number | null | undefined): string | null => {
  if (!dateField) return null;
  
  try {
    // If it's already an ISO string, validate it
    if (typeof dateField === 'string') {
      // Check if it's a Unix timestamp in string form
      if (/^\d+$/.test(dateField)) {
        const timestamp = parseInt(dateField);
        // If the timestamp is in seconds (OpenAI API format), convert to milliseconds
        const dateValue = timestamp < 946684800000 ? timestamp * 1000 : timestamp;
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } else {
        // Try to parse as ISO string
        const date = new Date(dateField);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    // If it's a number, assume it's a unix timestamp
    if (typeof dateField === 'number') {
      // If the timestamp is in seconds (OpenAI API format), convert to milliseconds
      const dateValue = dateField < 946684800000 ? dateField * 1000 : dateField;
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    console.warn('[ThreadService] Could not format date field:', dateField);
    return null;
  } catch (error) {
    console.error('[ThreadService] Error formatting date field:', error);
    return null;
  }
};

export class ThreadService {
  private supabase = createClient();
  private streamStore = useStreamStore.getState();

  /**
   * Fetches both thread and run data for a user via API
   * @param userId User ID to fetch data for
   * @returns Promise with thread and run data
   */
  async getUserThreadData(userId: string): Promise<UserThreadData> {
    try {
      const response = await fetch('/api/openai/threads');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user thread data');
      }
      
      const threadsResponse = await response.json();
      
      // Process the threads from the API response - handle both data.data and data formats
      const threads: ChatThread[] = threadsResponse.data || [];
        
      // Fetch runs for each thread
      const runsPromises = threads.map(async (thread) => {
        try {
          // Get all runs for this thread instead of just checking for last_run
            const runsResponse = await fetch(`/api/openai/threads/${thread.thread_id}/run`);
          
          if (!runsResponse.ok) {
             return [];
          }
          
          const runsData = await runsResponse.json();
            
          // If the response has data property (list of runs)
          if (runsData.data && Array.isArray(runsData.data)) {
            return runsData.data.map((run: any) => ({
              id: run.id || `run_${Date.now()}`, // Generate an ID if none exists
              created_at: formatDateField(run.created_at),
              updated_at: formatDateField(run.updated_at) || new Date().toISOString(),
              run_id: run.id,
              thread_id: thread.thread_id,
              assistant_id: run.assistant_id || thread.assistant_id || null,
              user_id: userId,
              status: run.status || 'unknown',
              started_at: formatDateField(run.started_at),
              completed_at: formatDateField(run.completed_at),
              cancelled_at: formatDateField(run.cancelled_at),
              failed_at: formatDateField(run.failed_at),
              expires_at: formatDateField(run.expires_at),
              last_error: run.last_error?.message || null,
              model: run.model,
              instructions: run.instructions,
              tools: run.tools,
              metadata: run.metadata,
              required_action: run.required_action,
              prompt_tokens: run.usage?.prompt_tokens ? parseInt(String(run.usage.prompt_tokens)) : null,
              completion_tokens: run.usage?.completion_tokens ? parseInt(String(run.usage.completion_tokens)) : null,
              total_tokens: run.usage?.total_tokens ? parseInt(String(run.usage.total_tokens)) : null,
              temperature: run.temperature ? parseFloat(String(run.temperature)) : null,
              top_p: run.top_p ? parseFloat(String(run.top_p)) : null,
              max_prompt_tokens: run.max_prompt_tokens ? parseInt(String(run.max_prompt_tokens)) : null,
              max_completion_tokens: run.max_completion_tokens ? parseInt(String(run.max_completion_tokens)) : null,
              truncation_strategy: run.truncation_strategy || null,
              response_format: run.response_format,
              tool_choice: run.tool_choice,
              parallel_tool_calls: run.parallel_tool_calls || null,
              additional_instructions: run.additional_instructions || null
            }));
          }
          
          // If the response has a single run property
          if (runsData.run) {
            const run = runsData.run;
            return [{
              id: run.id || `run_${Date.now()}`, // Generate an ID if none exists
              created_at: formatDateField(run.created_at),
              updated_at: formatDateField(run.updated_at) || new Date().toISOString(),
              run_id: run.id,
              thread_id: thread.thread_id,
              assistant_id: run.assistant_id || thread.assistant_id || null,
              user_id: userId,
              status: run.status || 'unknown',
              started_at: formatDateField(run.started_at),
              completed_at: formatDateField(run.completed_at),
              cancelled_at: formatDateField(run.cancelled_at),
              failed_at: formatDateField(run.failed_at),
              expires_at: formatDateField(run.expires_at),
              last_error: run.last_error?.message || null,
              model: run.model,
              instructions: run.instructions,
              tools: run.tools,
              metadata: run.metadata,
              required_action: run.required_action,
              prompt_tokens: run.usage?.prompt_tokens ? parseInt(String(run.usage.prompt_tokens)) : null,
              completion_tokens: run.usage?.completion_tokens ? parseInt(String(run.usage.completion_tokens)) : null,
              total_tokens: run.usage?.total_tokens ? parseInt(String(run.usage.total_tokens)) : null,
              temperature: run.temperature ? parseFloat(String(run.temperature)) : null,
              top_p: run.top_p ? parseFloat(String(run.top_p)) : null,
              max_prompt_tokens: run.max_prompt_tokens ? parseInt(String(run.max_prompt_tokens)) : null,
              max_completion_tokens: run.max_completion_tokens ? parseInt(String(run.max_completion_tokens)) : null,
              truncation_strategy: run.truncation_strategy || null,
              response_format: run.response_format,
              tool_choice: run.tool_choice,
              parallel_tool_calls: run.parallel_tool_calls || null,
              additional_instructions: run.additional_instructions || null
            }];
          }
          
          // If we can't parse the response in any known format
          return [];
        } catch (error) {
          console.error(`[ThreadService] Error fetching runs for thread ${thread.thread_id}:`, error);
          return [];
        }
      });
      
      const runsArrays = await Promise.all(runsPromises);
       const runs = runsArrays.flat().filter(run => run); // Filter out any undefined/null runs
      
      return {
        threads,
        runs
      };
    } catch (error) {
      console.error('[ThreadService] Error in getUserThreadData:', error);
      throw error;
    }
  }

  /**
   * Fetches runs for a specific thread via API
   * @param threadId Thread ID to fetch runs for
   * @returns Promise with thread run data
   */
  async getThreadRunsByThreadId(threadId: string): Promise<ThreadRun[]> {
    try {
      const response = await fetch(`/api/openai/threads/${threadId}/run`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch thread runs');
      }
      
      const data = await response.json();
      const openaiRuns = data.data || [];
      
      // Convert OpenAI run format to our ThreadRun format
      return openaiRuns.map((run: any) => ({
        id: run.id, // This might need to be generated
        created_at: formatDateField(run.created_at),
        updated_at: formatDateField(run.updated_at) || new Date().toISOString(),
        run_id: run.id,
        thread_id: threadId,
        assistant_id: run.assistant_id,
        user_id: '', // This would need to be filled in from somewhere
        status: run.status,
        started_at: formatDateField(run.started_at),
        completed_at: formatDateField(run.completed_at),
        cancelled_at: formatDateField(run.cancelled_at),
        failed_at: formatDateField(run.failed_at),
        expires_at: formatDateField(run.expires_at),
        last_error: run.last_error?.message || null,
        model: run.model,
        instructions: run.instructions,
        tools: run.tools,
        metadata: run.metadata,
        required_action: run.required_action,
        prompt_tokens: run.usage?.prompt_tokens ? parseInt(String(run.usage.prompt_tokens)) : null,
        completion_tokens: run.usage?.completion_tokens ? parseInt(String(run.usage.completion_tokens)) : null,
        total_tokens: run.usage?.total_tokens ? parseInt(String(run.usage.total_tokens)) : null,
        temperature: run.temperature ? parseFloat(String(run.temperature)) : null,
        top_p: run.top_p ? parseFloat(String(run.top_p)) : null,
        max_prompt_tokens: run.max_prompt_tokens ? parseInt(String(run.max_prompt_tokens)) : null,
        max_completion_tokens: run.max_completion_tokens ? parseInt(String(run.max_completion_tokens)) : null,
        truncation_strategy: run.truncation_strategy || null,
        response_format: run.response_format,
        tool_choice: run.tool_choice,
        parallel_tool_calls: run.parallel_tool_calls || null,
        additional_instructions: run.additional_instructions || null
      }));
    } catch (error) {
      console.error('[ThreadService] Error in getThreadRunsByThreadId:', error);
      throw error;
    }
  }

  /**
   * Creates a new run for a thread
   * @param threadId Thread ID to create run for
   * @param assistantId Assistant ID to use for the run
   * @returns Promise with created run
   */
  async createRun(threadId: string, assistantId: string, settings: any = {}, messages: any = {}): Promise<ThreadRun> {
    try {
      // Reset the streaming store state
      this.streamStore.resetStream();
      
      // If we want to stream, use the streaming store's startStream method
      if (settings.stream) {
        // Start streaming process via the streamStore
        await this.streamStore.startStream(threadId, assistantId);
        
        // Check if we have a currentRunId from the streaming process
        const runId = this.streamStore.currentRunId;
        
        if (!runId) {
          throw new Error('Failed to obtain run ID from streaming process');
        }
        
        // Use the run ID from the streaming process to construct a ThreadRun object
        return {
          id: runId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          run_id: runId,
          thread_id: threadId,
          assistant_id: assistantId,
          user_id: '',
          status: 'in_progress', // Assume in_progress since we just started streaming
          started_at: new Date().toISOString(),
          completed_at: null,
          cancelled_at: null,
          failed_at: null,
          expires_at: null,
          last_error: null,
          model: settings.model || null,
          instructions: settings.instructions || null,
          tools: settings.tools || null,
          metadata: settings.metadata || null,
          required_action: null,
          prompt_tokens: null,
          completion_tokens: null,
          total_tokens: null,
          temperature: settings.temperature ? parseFloat(String(settings.temperature)) : null,
          top_p: settings.top_p ? parseFloat(String(settings.top_p)) : null,
          max_prompt_tokens: settings.max_prompt_tokens ? parseInt(String(settings.max_prompt_tokens)) : null,
          max_completion_tokens: settings.max_completion_tokens ? parseInt(String(settings.max_completion_tokens)) : null,
          truncation_strategy: settings.truncation_strategy || null,
          response_format: settings.response_format,
          tool_choice: settings.tool_choice,
          parallel_tool_calls: settings.parallel_tool_calls || null,
          additional_instructions: settings.additional_instructions || null
        };
      }
      
      // For non-streaming cases, continue with the existing implementation
      const response = await fetch(`/api/openai/threads/${threadId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          settings,
          messages
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create run');
      }
      
      const data = await response.json();
      const run = data.run;
      
      return {
        id: run.id, // This might need to be generated
        created_at: formatDateField(run.created_at),
        updated_at: new Date().toISOString(),
        run_id: run.id,
        thread_id: threadId,
        assistant_id: run.assistant_id,
        user_id: '', // This would need to be filled in from somewhere
        status: run.status,
        started_at: formatDateField(run.started_at),
        completed_at: formatDateField(run.completed_at),
        cancelled_at: formatDateField(run.cancelled_at),
        failed_at: formatDateField(run.failed_at),
        expires_at: formatDateField(run.expires_at),
        last_error: run.last_error?.message || null,
        model: run.model,
        instructions: run.instructions,
        tools: run.tools,
        metadata: run.metadata,
        required_action: run.required_action,
        prompt_tokens: run.usage?.prompt_tokens ? parseInt(String(run.usage.prompt_tokens)) : null,
        completion_tokens: run.usage?.completion_tokens ? parseInt(String(run.usage.completion_tokens)) : null,
        total_tokens: run.usage?.total_tokens ? parseInt(String(run.usage.total_tokens)) : null,
        temperature: run.temperature ? parseFloat(String(run.temperature)) : null,
        top_p: run.top_p ? parseFloat(String(run.top_p)) : null,
        max_prompt_tokens: run.max_prompt_tokens ? parseInt(String(run.max_prompt_tokens)) : null,
        max_completion_tokens: run.max_completion_tokens ? parseInt(String(run.max_completion_tokens)) : null,
        truncation_strategy: run.truncation_strategy || null,
        response_format: run.response_format,
        tool_choice: run.tool_choice,
        parallel_tool_calls: run.parallel_tool_calls || null,
        additional_instructions: run.additional_instructions || null
      };
    } catch (error) {
      console.error('[ThreadService] Error in createRun:', error);
      throw error;
    }
  }

  /**
   * Creates a new thread
   * @returns Promise with created thread
   */
  async createThread(): Promise<ChatThread> {
    try {
      const response = await fetch('/api/openai/threads', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create thread');
      }
      
      const data = await response.json();
      
      // The endpoint returns the OpenAI thread and the threadId separately
      return {
        is_active: true,
        messages: [],
        id: data.threadId, // Using OpenAI's thread ID as our ID
        user_id: await userId(), // This would be filled in by Supabase
        assistant_id: null,
        status: 'active',
        created_at: formatDateField(data.thread.created_at) || null,
        updated_at: formatDateField(data.thread.created_at) || null,
        metadata: data.thread.metadata,
        thread_id: data.threadId,
        title: data.thread.title,
        last_message_at: null,
        tool_resources: null,
        last_run: null,
        last_run_status: null
      };
    } catch (error) {
      console.error('[ThreadService] Error in createThread:', error);
      throw error;
    }
  }
}

export default new ThreadService();
