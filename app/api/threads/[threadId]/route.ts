import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai as awaitOpenai } from '@/utils/openai'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'
import type { ChatThread } from '@/types/database'
import fetch from 'node-fetch';

export async function GET(request: NextRequest): Promise<Response> {

  const openai = await awaitOpenai();
  
  try {
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
    const { searchParams } = request.nextUrl;
    const threadId = request.nextUrl.pathname.split('/').pop(); // Extract threadId from the URL path

    console.log('Request received for threadId:', threadId);

    if (!threadId) {
      console.log('Thread ID is missing from the request.');
      return new Response(JSON.stringify({ 
        error: 'Thread ID is required',
        code: 'INVALID_REQUEST'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    console.log('Fetching messages for threadId:', threadId);
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': "assistants=v2"
      },
    });

    console.log('Response status from OpenAI API:', response.status);

    if (!response.ok) {
      console.log('Failed to fetch from OpenAI API with status:', response.status);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch from OpenAI API',
        code: 'EXTERNAL_API_ERROR'
      }), { 
        status: response.status, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    const data = await response.json();

    // Assuming the response is in the expected format
    const formattedResponse = {
      object: data.object,
      data: data.data,
      first_id: data.data[0]?.id || null,
      last_id: data.data[data.data.length - 1]?.id || null,
      has_more: data.has_more || false
    };

    return new Response(JSON.stringify(formattedResponse), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to list threads',
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