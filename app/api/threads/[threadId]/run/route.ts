// app/api/threads/[threadId]/run/route.ts
import { createServer } from "@/utils/supabase/server";
import { openai as awaitOpenai } from '@/utils/openai';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// GET: List runs or retrieve a specific run
export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
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
    const { threadId } = params;
    const { searchParams } = new URL(req.url);
    
    // Check if this is a retrieve request (has run_id parameter)
    const run_id = searchParams.get('run_id');
    
    if (!threadId) {
      console.error('[API] Missing threadId parameter');
      return NextResponse.json(
        { success: false, error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    if (run_id) {
      // Retrieve specific run
      console.log(`[API] Retrieving run ${run_id} for thread ${threadId}`);
      const run = await openai.beta.threads.runs.retrieve(threadId, run_id);
      return NextResponse.json({ run });
    } else {
      // List runs with optional pagination parameters
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
      const order = searchParams.get('order') as 'asc' | 'desc' | undefined || 'desc';
      const after = searchParams.get('after') || undefined;
      const before = searchParams.get('before') || undefined;

      console.log(`[API] Listing runs for thread ${threadId} with params:`, { limit, order, after, before });
      
      const runs = await openai.beta.threads.runs.list(threadId, {
        limit,
        order,
        after,
        before
      });

      return NextResponse.json(runs);
    }
  } catch (error: any) {
    console.error('[API] Error retrieving run(s):', error);
    return NextResponse.json(
      { success: false, error: error.message || "Error retrieving runs" },
      { status: error.status || 500 }
    );
  }
}
