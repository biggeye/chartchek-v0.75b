// app/api/threads/[threadId]/run/[runId]/submit-tool-outputs/stream/route.ts
import { createServer } from "@/utils/supabase/server";
import { useOpenAI } from '@/lib/contexts/OpenAIProvider';
import { NextRequest, NextResponse } from 'next/server';

const { openai, isLoading, error } = useOpenAI() 
  
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string; runId: string }> }
) {
  
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API] Unauthorized route access', authError);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId, runId } = await params;
    const body = await req.json();
    const { tool_outputs } = body;
    
    console.log(`[API] Streaming tool outputs for run ${runId} in thread ${threadId}`);
    
    if (!threadId || !runId || !tool_outputs || !Array.isArray(tool_outputs)) {
      console.error('[API] Missing or invalid required parameters:', { threadId, runId, tool_outputs });
      return NextResponse.json({ success: false, error: "Missing or invalid required parameters" }, { status: 400 });
    }

    // Create a new ReadableStream that will be used to stream the output
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await openai!.beta.threads.runs.submitToolOutputs(
            threadId,
            runId,
            {
              tool_outputs,
              stream: true
            },
          );

          // Process the stream
          for await (const chunk of stream) {
            if (chunk.event === 'thread.message.created') {
              const event = {
                type: 'thread.message.created',
                data: {
                  id: chunk.data.id,
                  thread_id: chunk.data.thread_id,
                  role: chunk.data.role,
                  content: chunk.data.content
                }
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } else if (chunk.event === 'thread.message.delta') {
              const event = {
                type: 'thread.message.delta',
                data: chunk.data
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } else if (chunk.event === 'thread.run.completed') {
              const event = {
                type: 'thread.run.completed',
                data: chunk.data
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          }

          // Send the [DONE] event to signal the end of the stream
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[API] Error streaming tool outputs:', error);
          const errorEvent = {
            type: 'error',
            data: { message: (error as Error)?.message || 'Unknown error' }
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          controller.close();
        }
      }
    });

    // Return the stream as Server-Sent Events (SSE)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error('[API] Error setting up streaming for tool outputs:', error);
    return NextResponse.json({ success: false, error: error.message || "Error streaming tool outputs" }, { status: error.status || 500 });
  }
}
