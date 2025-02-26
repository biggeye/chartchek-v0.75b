import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai } from '@/utils/openai'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'
import fetch from 'node-fetch';

export async function GET(request: NextRequest): Promise<Response> {


  
  
   const supabase = await createServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }
    
    // Get pagination params
    try{
    const { searchParams } = request.nextUrl;
    const urlParts = request.nextUrl.pathname.split('/');
    const threadId = urlParts[urlParts.length - 1]; // Extract threadId from the URL path

    if (!threadId || threadId === '[threadId]') {

      return new Response(JSON.stringify({ 
        error: 'Thread ID is required',
        code: 'INVALID_REQUEST'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }


    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': "assistants=v2"
      },
    });

    if (!response.ok) {
      console.log('Failed to fetch from OpenAI API with status:', response.status);
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        error: errorData.error?.message || 'Failed to fetch from OpenAI API',
        code: 'EXTERNAL_API_ERROR',
        status: response.status
      }), { 
        status: response.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

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
  const threadId = request.nextUrl.pathname.split('/').pop();

  const threadPosted = await supabase.from('chat_threads').insert({
    user_id: user.id,
    thread_id: threadId
  })
  .single();  

  return new Response(JSON.stringify(threadPosted), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json' } 
  })
}

export async function DELETE(request: NextRequest): Promise<Response> {
   const newOpenAI = await openai();
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
  const threadId = request.nextUrl.pathname.split('/').pop();
  
  if (!threadId) {
    return new Response(JSON.stringify({ 
      error: 'Thread ID is required',
      code: 'THREAD_ID_REQUIRED'
    }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  const threadDeletedFromOpenAI = await newOpenAI.beta.threads.del(threadId);
  if (!threadDeletedFromOpenAI) {
    return new Response(JSON.stringify({ 
      error: 'Failed to delete thread from OpenAI',
      code: 'DELETE_THREAD_OPENAI_FAILED'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  const threadDeleted = await supabase.from('chat_threads').delete().eq('thread_id', threadId).single();  
  return new Response(JSON.stringify(threadDeleted), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json' } 
  })

}