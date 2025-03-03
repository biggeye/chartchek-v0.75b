import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ChatThread {
  id: string;
  user_id: string;
  assistant_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any;
  thread_id: string;
  title: string | null;
  last_message_at: string | null;
  is_active: boolean;
  tool_resources: any;
  last_run: string | null;
  last_run_status: string | null;
}

export interface ThreadRun {
  id: string;
  created_at: string;
  updated_at: string;
  run_id: string;
  thread_id: string;
  assistant_id: string;
  user_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  failed_at: string | null;
  expires_at: string | null;
  last_error: string | null;
  model: string | null;
  instructions: string | null;
  tools: any;
  metadata: any;
  required_action: any;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  temperature: number | null;
  top_p: number | null;
  max_prompt_tokens: number | null;
  max_completion_tokens: number | null;
  truncation_strategy: string | null;
  response_format: any;
  tool_choice: any;
  parallel_tool_calls: boolean | null;
  additional_instructions: string | null;
}

export interface UserThreadData {
  threads: ChatThread[];
  runs: ThreadRun[];
}

export class ThreadService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Fetches both thread and run data for a user via API
   * @param userId User ID to fetch data for
   * @returns Promise with thread and run data
   */
  async getUserThreadData(userId: string): Promise<UserThreadData> {
    try {
      const response = await fetch(`/api/user/threads?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user thread data');
      }
      
      const data = await response.json();
      return {
        threads: data.threads || [],
        runs: data.runs || []
      };
    } catch (error) {
      console.error('[ThreadService] Error in getUserThreadData:', error);
      throw error;
    }
  }

  /**
   * Fetches chat threads for a user directly from Supabase
   * @param userId User ID to fetch threads for
   * @returns Promise with thread data
   */
  async getChatThreadsByUserId(userId: string): Promise<ChatThread[]> {
    const { data, error } = await this.supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ThreadService] Error fetching chat threads:', error);
      throw new Error('Failed to fetch chat threads');
    }

    return data || [];
  }

  /**
   * Fetches thread runs for a specific thread ID directly from Supabase
   * @param threadId Thread ID to fetch runs for
   * @returns Promise with thread run data
   */
  async getThreadRunsByThreadId(threadId: string): Promise<ThreadRun[]> {
    const { data, error } = await this.supabase
      .from('thread_runs')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ThreadService] Error fetching thread runs:', error);
      throw new Error('Failed to fetch thread runs');
    }

    return data || [];
  }

  /**
   * Fetches all thread runs for a user directly from Supabase
   * @param userId User ID to fetch runs for
   * @returns Promise with thread run data
   */
  async getThreadRunsByUserId(userId: string): Promise<ThreadRun[]> {
    const { data, error } = await this.supabase
      .from('thread_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ThreadService] Error fetching thread runs:', error);
      throw new Error('Failed to fetch thread runs');
    }

    return data || [];
  }
}

export default new ThreadService();
