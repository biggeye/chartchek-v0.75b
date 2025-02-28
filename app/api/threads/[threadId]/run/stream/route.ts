// app/api/threads/[threadId]/run/stream/route.ts
import { createServer } from "@/utils/supabase/server";
import OpenAI from "openai";
import { NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Define interface for the text object coming from OpenAI
interface OpenAIText {
  id?: string;
  value: string;
  annotations?: any[];
  [key: string]: any;
}

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
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
    const threadId = params.threadId;

    console.log(`[API] Starting stream request to thread ${threadId} with assistantId ${assistant_id}`);

    // Variable to keep track of the latest curated content
    let lastCuratedContent: Array<{ text: { value: string; annotations: any[] } }> = [];

    // Create a new ReadableStream for SSE events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create the live assistant stream
          const runStream = openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistant_id,
            stream: true,
          });

          // Handle initial text creation
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
          runStream.on('end', () => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'messageCompleted',
              data: { content: lastCuratedContent },
            })}\n\n`);
            controller.close();
          });

          // On error, emit an error event and close the stream
          runStream.on('error', (error: any) => {
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
