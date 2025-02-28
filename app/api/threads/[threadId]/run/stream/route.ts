// app/api/threads/[threadId]/run/stream/route.ts
import { createServer } from "@/utils/supabase/server";
import { openai as awaitOpenai } from '@/utils/openai';
import { NextRequest } from 'next/server';

// Define interface for Text object from OpenAI
interface OpenAIText {
  id?: string;
  value: string;
  [key: string]: any; // Allow for other properties
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const openai = await awaitOpenai();
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
    // Extract threadId from URL pathname
    const { pathname } = new URL(req.url);
    const threadId = pathname.split('/')[3]; // Get the threadId from the URL path segments
    const body = await req.json();
    const assistant_id: string = body.assistantId;

    console.log(`[API] Starting stream request to thread ${threadId} with assistantId ${assistant_id}`);
    // Fetch assistant_id using threadId from Supabase
 /*   const { data, error } = await supabase
      .from('chat_threads')
      .select('assistant_id')
      .eq('thread_id', threadId)
      .single();
    if (error || !data) {
      console.error('[API] Error fetching assistant_id:', error);
      return new Response('Error fetching assistant_id', { status: 500 });
    }
    const assistant_id = data.assistant_id;
   */ 

    
    if (!threadId || !assistant_id) {
      console.error('[API] Missing required parameters:', { threadId, assistant_id });
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a new ReadableStream for SSE events.
    const stream = new ReadableStream({
      async start(controller) {
        console.log('[API]', assistant_id, 'Stream started');
        try {
          let currentRunId: string | null = null;
          let lastStepId: string | null = null;

          const run = openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistant_id,
            stream: true
          });

          // Text event: textCreated
          run.on('textCreated', (text: OpenAIText) => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'textCreated',
              data: text
            })}\n\n`);
            
            // Also emit a messageCreated event with the message ID
            if (text.id) {
              console.log('[API]', new Date().toISOString(), 'Message created with ID:', text.id);
              controller.enqueue(`data: ${JSON.stringify({
                type: 'messageCreated',
                data: { id: text.id, thread_id: threadId }
              })}\n\n`);
            }
          });

          // Text event: textDelta
          run.on('textDelta', (textDelta, snapshot) => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'textDelta',
              data: { delta: textDelta, snapshot }
            })}\n\n`);
          });

          // Tool call event: toolCallCreated
          run.on('toolCallCreated', async (toolCall: any) => {
            console.log('[API]', new Date().toISOString(), 'Event received: toolCallCreated', toolCall);
            if (!currentRunId && toolCall.run_id) {
              currentRunId = toolCall.run_id;
              console.log('[API]', new Date().toISOString(), 'Set currentRunId:', currentRunId);
            }

            controller.enqueue(`data: ${JSON.stringify({
              type: 'toolCallCreated',
              data: toolCall
            })}\n\n`);

            // Fetch and stream run step details
            if (currentRunId) {
              try {
                const steps = await openai.beta.threads.runs.steps.list(
                  threadId,
                  currentRunId,
                  { limit: 1, order: 'desc' }
                );
                if (steps.data[0] && steps.data[0].id !== lastStepId) {
                  lastStepId = steps.data[0].id;
                  console.log('[API]', new Date().toISOString(), 'New run step created:', steps.data[0]);
                  controller.enqueue(`data: ${JSON.stringify({
                    type: 'stepCreated',
                    data: steps.data[0]
                  })}\n\n`);
                }
              } catch (error) {
                console.error('[API]', new Date().toISOString(), 'Error fetching run steps:', error);
              }
            }
          });

          // Tool call event: toolCallDelta
          run.on('toolCallDelta', (toolCallDelta, snapshot) => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'toolCallDelta',
              data: { delta: toolCallDelta, snapshot }
            })}\n\n`);

            // If code interpreter event, include input and outputs
            if (toolCallDelta.type === 'code_interpreter' && toolCallDelta.code_interpreter) {
              const codeInterpreter = toolCallDelta.code_interpreter;
              if (codeInterpreter.input) {
                console.log('[API]', new Date().toISOString(), 'Code interpreter input:', codeInterpreter.input);
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'codeInput',
                  data: codeInterpreter.input
                })}\n\n`);
              }
              if (codeInterpreter.outputs) {
                console.log('[API]', new Date().toISOString(), 'Code interpreter outputs:', codeInterpreter.outputs);
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'codeOutput',
                  data: codeInterpreter.outputs
                })}\n\n`);
              }
            }
          });

          // Error handling for the stream
          run.on('error', async (error: Error) => {
            console.error('[API]', new Date().toISOString(), 'Run event error:', error);
            if (currentRunId) {
              await supabase
                .from("runs")
                .update({ status: 'failed', error: error.message })
                .eq('run_id', currentRunId);
              console.log('[API]', new Date().toISOString(), 'Updated run status to failed for run_id:', currentRunId);
            }
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              data: error.message
            })}\n\n`);
            controller.close();
          });

          // End event handling
          run.on('end', async () => {
            console.log('[API]', new Date().toISOString(), 'Run event: end received');
            if (currentRunId) {
              await supabase
                .from("runs")
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('run_id', currentRunId);
              console.log('[API]', new Date().toISOString(), 'Updated run status to completed for run_id:', currentRunId);
              try {
                const finalSteps = await openai.beta.threads.runs.steps.list(threadId, currentRunId);
                console.log('[API]', new Date().toISOString(), 'Final run steps fetched:', finalSteps.data);
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'finalSteps',
                  data: finalSteps.data
                })}\n\n`);
              } catch (error) {
                console.error('[API]', new Date().toISOString(), 'Error fetching final run steps:', error);
              }
            }
            console.log('[API]', new Date().toISOString(), 'Enqueuing end event');
            controller.enqueue(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
            controller.close();
          });

          // Wait for completion (or error)
          await new Promise((resolve, reject) => {
            run.on('end', () => resolve(null));
            run.on('error', (error) => reject(error));
          });
        } catch (error) {
          console.error('[API]', new Date().toISOString(), 'Error in stream start:', error);
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            data: error instanceof Error ? error.message : 'Unknown error occurred'
          })}\n\n`);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error("[API]", new Date().toISOString(), "Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
