// app/api/threads/[threadId]/run/create/route.ts
import { createServer } from "@/utils/supabase/server";
import { openai as awaitOpenai } from '@/utils/openai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const openai = await awaitOpenai();
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API] Unauthorized access', authError);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = await params;
    const body = await req.json();
    const assistant_id: string = body.assistant_id;
    
    console.log(`[API] Creating run for thread ${threadId} with assistantId ${assistant_id}`);
    
    if (!threadId || !assistant_id) {
      console.error('[API] Missing required parameters:', { threadId, assistant_id });
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create run with optional parameters
    const runOptions: {
      assistant_id: string;
      model?: string;
      instructions?: string;
      tools?: any[];
      metadata?: Record<string, any>;
    } = {
      assistant_id,
      metadata: body.metadata || {}
    };

    // Add optional parameters if provided
    if (body.model) runOptions.model = body.model;
    if (body.instructions) runOptions.instructions = body.instructions;
    if (body.tools) runOptions.tools = body.tools;

    // Create run
    const run = await openai.beta.threads.runs.create(
      threadId,
      runOptions
    );

    console.log(`[API] Run created: ${run.id}`);
    
    // Store run data in the thread_runs table
    try {
      const { error: dbError } = await supabase.from('thread_runs').insert({
        run_id: run.id,
        thread_id: threadId,
        assistant_id: assistant_id,
        user_id: user.id,
        status: run.status,
        model: run.model,
        instructions: runOptions.instructions,
        tools: runOptions.tools,
        metadata: runOptions.metadata,
        temperature: run.temperature,
        top_p: run.top_p,
        max_prompt_tokens: run.max_prompt_tokens,
        max_completion_tokens: run.max_completion_tokens,
        truncation_strategy: run.truncation_strategy,
        response_format: run.response_format,
        tool_choice: run.tool_choice,
        parallel_tool_calls: run.parallel_tool_calls
      });
      
      if (dbError) {
        console.error('[API] Error storing run data:', dbError);
      } else {
        console.log('[API] Successfully stored run data in thread_runs table');
      }
      
      // Also update the chat_threads table with this run ID
      const { error: threadUpdateError } = await supabase
        .from('chat_threads')
        .update({
          last_run: run.id,
          last_run_status: run.status
        })
        .eq('thread_id', threadId);
        
      if (threadUpdateError) {
        console.error('[API] Error updating chat_threads with run data:', threadUpdateError);
      }
    } catch (storageError) {
      console.error('[API] Exception storing run data:', storageError);
    }

    return NextResponse.json({ run });
  } catch (error: any) {
    console.error('[API] Error creating run:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Error creating run" },
      { status: error.status || 500 }
    );
  }
}
