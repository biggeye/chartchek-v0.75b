// app/api/threads/[threadId]/run/[runId]/cancel/route.ts
import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from '@/utils/ai/openai/server'
;
import { NextRequest, NextResponse } from 'next/server';

const openai = getOpenAIClient()

  

export const maxDuration = 30;

// Using the correct Next.js 15 route handler parameter pattern with Promise
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string; runId: string }> }
) {
  
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API] Unauthorized access', authError);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId, runId } = await params;
    
    console.log(`[API] Cancelling run ${runId} in thread ${threadId}`);
    
    if (!threadId || !runId) {
      console.error('[API] Missing required parameters:', { threadId, runId });
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Cancel the run
    const run = await openai.beta.threads.runs.cancel(
      threadId,
      runId
    );

    console.log(`[API] Run ${runId} cancelled, status: ${run.status}`);
    return NextResponse.json({ run });
  } catch (error: any) {
    console.error('[API] Error cancelling run:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Error cancelling run" },
      { status: error.status || 500 }
    );
  }
}
