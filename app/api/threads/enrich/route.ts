import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { getOpenAIClient } from "@/utils/openai/server"


const openai = getOpenAIClient();


export async function GET(request: NextRequest) {
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
  try {
    // Replace this with your actual user extraction logic


    if (authError || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    console.log('[/api/threads/enrich] Enriching threads for user:', userId);

    // Retrieve all threads for the user
    const { data: threads, error: threadError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (threadError) throw threadError;

    const errorReport: any[] = [];

    const enrichedThreads = await Promise.all((threads || []).map(async (thread) => {
      try {
        // Try to get the list of runs for this thread from OpenAI
        let runsList;
        try {
          runsList = await openai.beta.threads.runs.list(thread.thread_id);
        } catch (error: any) {
          errorReport.push({ thread_id: thread.thread_id, error: error.message });
          return thread;
        }

        // Ensure the returned runsList is an array
        if (!Array.isArray(runsList)) {
          errorReport.push({ thread_id: thread.thread_id, error: 'Invalid runs list returned' });
          return thread;
        }
        
        let recentRun = null;
        if (runsList.length > 0) {
          // Upsert each run into thread_runs table to avoid duplication
          for (const run of runsList) {
            const runPayload = {
              run_id: run.id,
              thread_id: run.thread_id,
              assistant_id: run.assistant_id,
              user_id: userId,
              status: run.status,
              started_at: run.started_at,
              completed_at: run.completed_at,
              cancelled_at: run.cancelled_at,
              failed_at: run.failed_at,
              expires_at: run.expires_at,
              last_error: run.last_error,
              model: run.model,
              instructions: run.instructions,
              tools: run.tools,
              metadata: run.metadata,
              required_action: null, // adjust if needed
              prompt_tokens: run.usage?.prompt_tokens,
              completion_tokens: run.usage?.completion_tokens,
              total_tokens: run.usage?.total_tokens,
              temperature: run.temperature,
              top_p: run.top_p,
              max_prompt_tokens: run.max_prompt_tokens,
              max_completion_tokens: run.max_completion_tokens,
              truncation_strategy: run.truncation_strategy,
              response_format: run.response_format,
              tool_choice: run.tool_choice,
              parallel_tool_calls: run.parallel_tool_calls,
            };

            const { error: upsertError } = await supabase
              .from('thread_runs')
              .upsert(runPayload, { onConflict: 'run_id' });
            if (upsertError) {
              errorReport.push({ thread_id: thread.thread_id, run_id: run.id, error: upsertError.message });
            }
          }

          // Determine the most recent run based on created_at
          recentRun = runsList.sort((a: any, b: any) => b.created_at - a.created_at)[0];
        }
        
        // Update chat_threads table with the most recent run id and its status
        if (recentRun) {
          const updatePayload = {
            last_run: recentRun.id,
            last_run_status: recentRun.status,
          };
          const { error: updateError } = await supabase
            .from('chat_threads')
            .update(updatePayload)
            .eq('thread_id', thread.thread_id)
            .eq('user_id', userId);
          if (updateError) {
            errorReport.push({ thread_id: thread.thread_id, error: updateError.message });
          }
        } else {
          // No runs found; update thread with null values for last_run and last_run_status
          const updatePayload = {
            last_run: null,
            last_run_status: null,
          };
          const { error: updateError } = await supabase
            .from('chat_threads')
            .update(updatePayload)
            .eq('thread_id', thread.thread_id)
            .eq('user_id', userId);
          if (updateError) {
            errorReport.push({ thread_id: thread.thread_id, error: updateError.message });
          }
        }
        
        return { 
          ...thread, 
          last_run: recentRun ? recentRun.id : null, 
          last_run_status: recentRun ? recentRun.status : null 
        };
      } catch (threadProcessError: any) {
        errorReport.push({ thread_id: thread.thread_id, error: threadProcessError.message });
        return thread;
      }
    }));

    const responsePayload = {
      enrichedThreads,
      errorReport,
    };

    console.log(
      '[/api/threads/enrich] Completed enrichment. Processed threads:',
      enrichedThreads.length,
      'Errors:',
      errorReport.length
    );

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[/api/threads/enrich] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to enrich threads',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
