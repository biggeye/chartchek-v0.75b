import { createClient } from '@/utils/supabase/client';
import OpenAI from 'openai';
import { useNewStreamingStore } from '@/store/newStreamStore';
import { ChatMessage, ChatThread } from '@/types/database';
import { ThreadRun } from '@/types/store/newStream';
import { Thread, RunStatusResponse } from '@/types/store/chat';
import { NewStreamingState } from '@/types/store/newStream';


const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
      const date = new Date(dateField);
      // Check if date is valid and not from 1970 (which would indicate a possible unix timestamp in seconds)
      if (!isNaN(date.getTime()) && date.getFullYear() > 1971) {
        return date.toISOString();
      }
    }
    
    // If it's a number or a string that's not a valid recent date, assume it's a unix timestamp
    // Check if it needs to be multiplied by 1000 (seconds to milliseconds)
    const timestamp = typeof dateField === 'number' ? dateField : parseInt(dateField);
    if (!isNaN(timestamp)) {
      // If the timestamp is in seconds (before year 2000), convert to milliseconds
      const dateValue = timestamp < 946684800 ? timestamp * 1000 : timestamp;
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Fallback to current time if all else fails
    return new Date().toISOString();
  } catch (error) {
    console.error('[ThreadService] Error formatting date field:', error);
    return new Date().toISOString();
  }
};

export class ThreadService {
  private supabase = createClient();
  private newStreamStore = useNewStreamingStore.getState();

  /**
   * Fetches both thread and run data for a user via API
   * @param userId User ID to fetch data for
   * @returns Promise with thread and run data
   */
  async getUserThreadData(userId: string): Promise<UserThreadData> {
    try {
      const response = await fetch('/api/threads');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user thread data');
      }
      
      const data = await response.json();
      
      // Process the threads from the API response
      const threads: ChatThread[] = data.data || [];
      console.log('[ThreadService] Fetched threads:', threads);
      
      // Fetch runs for each thread
      const runsPromises = threads.map(async (thread) => {
        try {
          // Get all runs for this thread instead of just checking for last_run
          console.log(`[ThreadService] Fetching runs for thread: ${thread.thread_id}`);
          const runsResponse = await fetch(`/api/threads/${thread.thread_id}/run`);
          
          if (!runsResponse.ok) {
            console.log(`[ThreadService] No runs found for thread: ${thread.thread_id}`);
            return [];
          }
          
          const runsData = await runsResponse.json();
          console.log(`[ThreadService] Runs data for thread ${thread.thread_id}:`, runsData);
          
          // If the response has data property (list of runs)
          if (runsData.data && Array.isArray(runsData.data)) {
            return runsData.data.map((run: any) => ({
              id: run.id || `run_${Date.now()}`, // Generate an ID if none exists
              created_at: formatDateField(run.created_at),
              updated_at: formatDateField(run.updated_at) || new Date().toISOString(),
              run_id: run.id,
              thread_id: thread.thread_id,
              assistant_id: run.assistant_id,
              user_id: userId,
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
              prompt_tokens: run.usage?.prompt_tokens ? String(run.usage.prompt_tokens) : null,
              completion_tokens: run.usage?.completion_tokens ? String(run.usage.completion_tokens) : null,
              total_tokens: run.usage?.total_tokens ? String(run.usage.total_tokens) : null,
              temperature: null,
              top_p: null,
              max_prompt_tokens: null,
              max_completion_tokens: null,
              truncation_strategy: null,
              response_format: run.response_format,
              tool_choice: run.tool_choice,
              parallel_tool_calls: null,
              additional_instructions: null
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
              assistant_id: run.assistant_id,
              user_id: userId,
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
              prompt_tokens: run.usage?.prompt_tokens ? String(run.usage.prompt_tokens) : null,
              completion_tokens: run.usage?.completion_tokens ? String(run.usage.completion_tokens) : null,
              total_tokens: run.usage?.total_tokens ? String(run.usage.total_tokens) : null,
              temperature: null,
              top_p: null,
              max_prompt_tokens: null,
              max_completion_tokens: null,
              truncation_strategy: null,
              response_format: run.response_format,
              tool_choice: run.tool_choice,
              parallel_tool_calls: null,
              additional_instructions: null
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
      console.log('[ThreadService] Runs arrays:', runsArrays);
      const runs = runsArrays.flat().filter(run => run); // Filter out any undefined/null runs
      console.log('[ThreadService] Fetched runs:', runs);
      
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
      const response = await fetch(`/api/threads/${threadId}/run`);
      
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
        prompt_tokens: run.usage?.prompt_tokens ? String(run.usage.prompt_tokens) : null,
        completion_tokens: run.usage?.completion_tokens ? String(run.usage.completion_tokens) : null,
        total_tokens: run.usage?.total_tokens ? String(run.usage.total_tokens) : null,
        temperature: null,
        top_p: null,
        max_prompt_tokens: null,
        max_completion_tokens: null,
        truncation_strategy: null,
        response_format: run.response_format,
        tool_choice: run.tool_choice,
        parallel_tool_calls: null,
        additional_instructions: null
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
      this.newStreamStore.resetStream();
      
      // If we want to stream, use the streaming store's startStream method
      if (settings.stream) {
        // Start streaming process via the newStreamStore
        await this.newStreamStore.startStream(threadId, assistantId);
        
        // Check if we have a currentRunId from the streaming process
        const runId = this.newStreamStore.currentRunId;
        
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
          temperature: null,
          top_p: null,
          max_prompt_tokens: null,
          max_completion_tokens: null,
          truncation_strategy: null,
          response_format: null,
          tool_choice: null,
          parallel_tool_calls: null,
          additional_instructions: null
        };
      }
      
      // For non-streaming cases, continue with the existing implementation
      const response = await fetch(`/api/threads/${threadId}/run`, {
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
        prompt_tokens: run.usage?.prompt_tokens ? String(run.usage.prompt_tokens) : null,
        completion_tokens: run.usage?.completion_tokens ? String(run.usage.completion_tokens) : null,
        total_tokens: run.usage?.total_tokens ? String(run.usage.total_tokens) : null,
        temperature: null,
        top_p: null,
        max_prompt_tokens: null,
        max_completion_tokens: null,
        truncation_strategy: null,
        response_format: run.response_format,
        tool_choice: run.tool_choice,
        parallel_tool_calls: null,
        additional_instructions: null
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
      const response = await fetch('/api/threads', {
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
