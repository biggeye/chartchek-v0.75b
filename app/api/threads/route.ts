import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import OpenAI from "openai"
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

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


  try {
    console.log('[/API/THREADS] Creating new thread for user:', user.id);
    const response = await openai.beta.threads.create();  
    const threadId = response.id;
    console.log('[/API/THREADS] Thread created in OpenAI:', threadId);
    const { data: threadData, error: threadError } = await supabase.from('chat_threads').insert({
      user_id: user.id,
      thread_id: threadId}).select().single();
    
    if (threadError) {
      console.error('[/API/THREADS] Error inserting thread in Supabase:', threadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save thread in database',
        code: 'DB_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[/API/THREADS] Thread inserted in Supabase:', threadData);
    
    // Return just the OpenAI thread data and ID
    return new Response(JSON.stringify({ 
      threadId: threadId,
      thread: response 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('[/api/threads] Error creating thread:', error);
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
    console.log('[/api/threads] Fetching threads for user:', user.id);
    
   const threads = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      

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