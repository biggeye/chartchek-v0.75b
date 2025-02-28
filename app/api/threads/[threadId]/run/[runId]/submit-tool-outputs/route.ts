// app/api/threads/[threadId]/run/[runId]/submit-tool-outputs/route.ts
import { createServer } from "@/utils/supabase/server";
import { openai as awaitOpenai } from '@/utils/openai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  context: { params: { threadId: string; runId: string } }
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
    const { threadId, runId } = context.params;
    const body = await req.json();
    const { tool_outputs, stream } = body;
    
    console.log(`[API] Submitting tool outputs for run ${runId} in thread ${threadId}`);
    
    if (!threadId || !runId || !tool_outputs || !Array.isArray(tool_outputs)) {
      console.error('[API] Missing or invalid required parameters:', { threadId, runId, tool_outputs });
      return NextResponse.json(
        { success: false, error: "Missing or invalid required parameters" },
        { status: 400 }
      );
    }

    // Submit tool outputs
    const run = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: tool_outputs,
        stream: stream === true
      }
    );

    // Handle the response based on whether streaming is enabled
    if (stream === true) {
      console.log(`[API] Tool outputs submitted for run ${runId} with streaming enabled`);
    } else {
      // Only access status property when not streaming (Run object)
      // TypeScript type assertion to help the compiler understand this is a Run object with status
      console.log(`[API] Tool outputs submitted for run ${runId}, status: ${(run as { status: string }).status}`);
    }
    
    return NextResponse.json({ run });
  } catch (error: any) {
    console.error('[API] Error submitting tool outputs:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Error submitting tool outputs" },
      { status: error.status || 500 }
    );
  }
}
