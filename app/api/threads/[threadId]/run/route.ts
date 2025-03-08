// app/api/threads/[threadId]/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from "@/utils/supabase/server";
import { useOpenAI } from '@/lib/contexts/OpenAIProvider';
import type { RunCreateResponse, ApiResponse } from '@/types/api/routes';

const { openai, isLoading, error: openaiError } = useOpenAI();

export const maxDuration = 60;

// GET: List runs or retrieve a specific run
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API] Unauthorized access', authError);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threadId } = await params;
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
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      const run = await openai.beta.threads.runs.retrieve(threadId, run_id);
      return NextResponse.json({ run });
    } else {
      // List runs with optional pagination parameters
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
      const order = searchParams.get('order') as 'asc' | 'desc' | undefined || 'desc';
      const after = searchParams.get('after') || undefined;
      const before = searchParams.get('before') || undefined;

      console.log(`[API] Listing runs for thread ${threadId} with params:`, { limit, order, after, before });
      
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
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
    const { assistant_id, settings, messages } = body;
    
    console.log(`[API] Creating run for thread ${threadId}`);
    
    if (!threadId || !assistant_id || !settings || !messages) {
      console.error('[API] Missing or invalid required parameters:', { threadId, assistant_id, settings, messages });
      return NextResponse.json(
        { success: false, error: "Missing or invalid required parameters" },
        { status: 400 }
      );
    }

    // Verify thread belongs to user
    const { data: threadData, error: threadError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single();
      
    if (threadError) {
      return NextResponse.json(
        { success: false, error: 'Thread not found or not authorized' },
        { status: 404 }
      );
    }

    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    // Create run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id
    });
    
    if (run) {
      console.log('[API] Run created:', run)
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