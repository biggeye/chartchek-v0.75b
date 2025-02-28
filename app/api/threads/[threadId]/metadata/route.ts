import { NextRequest } from 'next/server';
import { createServer } from "@/utils/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { threadId: string } }
): Promise<Response> {
  const supabase = await createServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED'
    }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const { threadId } = params;
  
  console.log('[API] threadId:', threadId)
  
  if (!threadId) {
    return new Response(JSON.stringify({ 
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
      return new Response(JSON.stringify({ 
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
    return new Response(JSON.stringify({ 
      success: true,
      thread: updatedThread
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error(`[/api/threads/${threadId}/metadata] Error updating thread metadata:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to update thread metadata',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
