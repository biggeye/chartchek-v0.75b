// app/api/threads/[threadId]/run/stream/route.ts
import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from '@/utils/openai/server'
;
import { NextRequest } from 'next/server';
import { Run } from "@/types/api/openai";

const openai = getOpenAIClient()

  

// Define interface for the text object coming from OpenAI
interface OpenAIText {
  id?: string;
  value: string;
  annotations?: any[];
  [key: string]: any;
}

export const maxDuration = 60;

/**
 * Streams run events for a thread
 * @route POST /api/threads/[threadId]/run/stream
 */
export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API] Unauthorized access', authError);
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const assistant_id: string = body.assistant_id;

    console.log(`[API] Starting stream request to thread ${threadId} with assistantId ${assistant_id}`);
    const metadata = await supabase
      .from('chat_threads')
      .select('metadata')
      .eq('thread_id', threadId)
      .single();

    const additionalInstructions = metadata?.data?.metadata?.additional_instructions;
    
    // Create run options
    const runOptions: {
      assistant_id: string;
      stream: true; // Must be exactly true for type compatibility
      instructions?: string;
      tools?: any[];
      metadata?: Record<string, any>;
      model?: string;
      additional_instructions?: string;
    } = {
      assistant_id,
      stream: true as const, // Use const assertion to ensure it's exactly true
      metadata: body.metadata || {}
    };

    // Add optional parameters if provided
    if (additionalInstructions) runOptions.additional_instructions = additionalInstructions;
    if (body.model) runOptions.model = body.model;
    if (body.instructions) runOptions.instructions = body.instructions;
    if (body.tools) runOptions.tools = body.tools;
    
    // Variable to keep track of the latest curated content
    let lastCuratedContent: Array<{ text: { value: string; annotations: any[] } }> = [];
    let runId: string | null = null;

    // Create a new ReadableStream for SSE events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create the live assistant stream
          const runStream = openai.beta.threads.runs.stream(threadId, runOptions);
          
          // Listen for all events and process based on the event type
          runStream.on('event', async (event: any) => {
            console.log(`[API] Received event type: ${event.type}`);
            
            // Run creation event
            if (event.type === 'thread.run.created') {
              const run = event.data;
              runId = run.id;
              
              // Also update the chat_threads table with this run ID
              const { error: threadUpdateError } = await supabase
                .from('chat_threads')
                .upsert({
                  thread_id: threadId,
                  run_id: run.id,
                  instructions: run.options.instructions,
                  tools: run.options.tools,
                  model: run.options.model,
                  additional_instructions: run.options.additional_instructions,
                  temperature: run.options.temperature,
                  top_p: run.options.top_p,
                  max_prompt_tokens: run.options.max_prompt_tokens,
                  max_completion_tokens: run.options.max_completion_tokens,
                  truncation_strategy: run.options.truncation_strategy,
                  response_format: run.options.response_format,
                  tool_choice: run.options.tool_choice,
                  parallel_tool_calls: run.options.parallel_tool_calls,
                  required_action: run.options.required_action,
                  failed_at: run.options.failed_at,
                  updated_at: new Date(),
                  last_run: run.id,
                  last_run_status: run.status
                })
                .eq('thread_id', threadId);
                
              if (threadUpdateError) {
                console.error('[API] Error updating chat_threads with run data:', threadUpdateError);
              }
            }
            
            // Run status change events
            if (['thread.run.queued', 'thread.run.in_progress', 'thread.run.requires_action',
                'thread.run.completed', 'thread.run.incomplete', 'thread.run.failed',
                'thread.run.cancelling', 'thread.run.cancelled', 'thread.run.expired'].includes(event.type)) {
              if (!runId) return;
              
              try {
                // Update the status in the database
                const { error: statusUpdateError } = await supabase
                  .from('thread_runs')
                  .update({ status: event.data.status })
                  .eq('run_id', runId);
                  
                if (statusUpdateError) {
                  console.error('[API] Error updating run status:', statusUpdateError);
                }
                
                // Also update the chat_threads table
                const { error: threadStatusError } = await supabase
                  .from('chat_threads')
                  .update({ last_run_status: event.data.status })
                  .eq('thread_id', threadId);
                  
                if (threadStatusError) {
                  console.error('[API] Error updating thread status:', threadStatusError);
                }
                
                // For completed runs, update the completed_at timestamp
                if (event.type === 'thread.run.completed') {
                  const now = new Date().toISOString();
                  await supabase
                    .from('thread_runs')
                    .update({ completed_at: now })
                    .eq('run_id', runId);
                }
                
                // For failed runs, update the failed_at timestamp and error message
                if (event.type === 'thread.run.failed') {
                  const now = new Date().toISOString();
                  await supabase
                    .from('thread_runs')
                    .update({ 
                      failed_at: now,
                      last_error: event.data.last_error?.message || 'Unknown error'
                    })
                    .eq('run_id', runId);
                }
              } catch (error) {
                console.error('[API] Exception updating status:', error);
              }
            }
          });

          // Handle textCreated events
          runStream.on('textCreated', (text: OpenAIText) => {
            const curatedContent = [
              {
                text: {
                  value: text.value,
                  annotations: text.annotations || [],
                },
              },
            ];
            lastCuratedContent = curatedContent;

            // Emit a "textCreated" event with the curated content
            controller.enqueue(`data: ${JSON.stringify({
              type: 'textCreated',
              data: { content: curatedContent },
            })}\n\n`);

            // If an ID is provided, also emit a "messageCreated" event
            if (text.id) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'messageCreated',
                data: {
                  id: text.id,
                  thread_id: threadId,
                  content: curatedContent,
                },
              })}\n\n`);
            }
          });

          // Handle text delta events
          runStream.on('textDelta', (delta: any, snapshot: any) => {
            const curatedDelta = [
              {
                text: {
                  value: delta.value,
                  annotations: delta.annotations || [],
                },
              },
            ];
            const curatedSnapshot = [
              {
                text: {
                  value: snapshot.value,
                  annotations: snapshot.annotations || [],
                },
              },
            ];
            // Update last known content with the latest snapshot
            lastCuratedContent = curatedSnapshot;

            controller.enqueue(`data: ${JSON.stringify({
              type: 'messageDelta',
              data: {
                delta: { content: curatedDelta },
                snapshot: { content: curatedSnapshot },
              },
            })}\n\n`);
          });

          // On stream end, send the final message content
          runStream.on('end', async () => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'messageCompleted',
              data: { content: lastCuratedContent },
            })}\n\n`);
            
            controller.close();
          });

          // On error, emit an error event and close the stream
          runStream.on('error', async (error: any) => {
            console.error('[API] Stream error:', error);
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              data: { message: error.message || 'Unknown error' },
            })}\n\n`);
            
            controller.close();
          });
        } catch (error: any) {
          console.error('[API] Error in stream:', error);
          controller.error(error);
        }
      },
    });

    // Return the SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[API] Error processing stream request:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error processing request" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
