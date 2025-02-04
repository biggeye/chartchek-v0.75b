import { createServer } from "@/utils/supabase/server";
import { OpenAI } from "openai";

export async function POST(req: Request) {
  const supabase = await createServer();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "OpenAI-Beta": "assistants=v2"
    }
  });

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
    const { thread_id, assistant_id } = await req.json();
    console.log('[API] Starting stream:', { thread_id, assistant_id });
    
    if (!thread_id || !assistant_id) {
      console.error('[API] Missing required parameters:', { thread_id, assistant_id });
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a new ReadableStream for SSE events.
    const stream = new ReadableStream({
      async start(controller) {
        console.log('[API]', new Date().toISOString(), 'Stream started');
        try {
          let currentRunId: string | null = null;
          let lastStepId: string | null = null;

          const run = openai.beta.threads.runs.stream(thread_id, {
            assistant_id: assistant_id,
            stream: true
          });

          // Text event: textCreated
          run.on('textCreated', (text) => {
            console.log('[API]', new Date().toISOString(), 'Event received: textCreated', text);
            controller.enqueue(`data: ${JSON.stringify({
              type: 'textCreated',
              data: text
            })}\n\n`);
          });

          // Text event: textDelta
          run.on('textDelta', (textDelta, snapshot) => {
            console.log('[API]', new Date().toISOString(), 'Event received: textDelta', { textDelta, snapshot });
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
                  thread_id,
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
            console.log('[API]', new Date().toISOString(), 'Event received: toolCallDelta', { toolCallDelta, snapshot });
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
                const finalSteps = await openai.beta.threads.runs.steps.list(thread_id, currentRunId);
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