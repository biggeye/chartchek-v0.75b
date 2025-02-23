import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai as awaitOpenai } from '@/utils/openai'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'
import type { ChatThread } from '@/types/database'


export async function POST(request: NextRequest): Promise<Response> {
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
  const openai = await awaitOpenai();

  try {
    const response = await openai.beta.threads.create();  
    const threadId = response.id;
    console.log('[/api/threads] Thread created: ', threadId, 200);
    return new Response(JSON.stringify({ threadId: threadId }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.log('[/api/threads] Response status:', 500);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(request: NextRequest): Promise<Response> {
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

  try {
    
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*');

    if (error) {
      throw error;
    }
    console.log('[/api/threads] Response status:', 200);
    return new Response(JSON.stringify(threads), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.log('[/api/threads] Response status:', 500);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve threads',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}