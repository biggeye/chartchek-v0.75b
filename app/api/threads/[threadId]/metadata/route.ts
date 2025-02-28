import { NextRequest, NextResponse } from 'next/server';
import { createServer } from "@/utils/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function PATCH(
  request: NextRequest,
  context: { params: { threadId: string } }
): Promise<NextResponse> {
  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
   
  const { threadId } = context.params;

  if (authError || !user) {
    return new NextResponse(JSON.stringify({ 
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED'
    }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  if (!threadId) {
    return new NextResponse(JSON.stringify({ 
      error: 'Thread ID is required',
      code: 'VALIDATION_ERROR'
    }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    // Get the request body for metadata
    const body = await request.json();
    const { metadata } = body;
    
    if (!metadata) {
      return new NextResponse(JSON.stringify({ 
        error: 'Metadata is required',
        code: 'VALIDATION_ERROR'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Update the thread metadata in OpenAI
    const updatedThread = await openai.beta.threads.update(threadId, {
      metadata
    });

    // Return the updated thread
    return new NextResponse(JSON.stringify({ 
      success: true,
      thread: updatedThread
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error(`[/api/threads/${threadId}/metadata] Error updating thread metadata:`, error);
    return new NextResponse(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to update thread metadata',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
