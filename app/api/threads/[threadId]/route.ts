import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { useOpenAI } from '@/lib/contexts/OpenAIProvider'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'

const { openai, isLoading, error: openaiError } = useOpenAI()

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
    
  try {
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

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    // Verify user has access to this thread
    const { data: threadData } = await supabase
      .from('chat_threads')
      .select('thread_id')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single();

    if (!threadData) {
      return new Response(JSON.stringify({ 
        error: 'Thread not found or access denied',
        code: 'NOT_FOUND'
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Fetch thread directly from OpenAI
    const openaiThread = await openai.beta.threads.retrieve(threadId);

    return new Response(JSON.stringify(openaiThread), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
  
  try {
    const urlParts = request.nextUrl.pathname.split('/');
    const threadId = urlParts[urlParts.length - 1];
    const { metadata } = await request.json();
    
    if (!threadId || threadId === '[threadId]') {
      return new Response(JSON.stringify({ 
        error: 'Thread ID is required',
        code: 'INVALID_REQUEST'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    // Update thread in OpenAI
    const updatedThread = await openai.beta.threads.update(threadId, {
      metadata
    });
    
    // Keep reference in Supabase up to date (but we don't return this data)
    const { error: updateError } = await supabase
      .from('chat_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Error updating thread reference in Supabase:', updateError);
      // Continue anyway since OpenAI update succeeded
    }
    
    return new Response(JSON.stringify(updatedThread), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to update thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
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
    const urlParts = request.nextUrl.pathname.split('/');
    const threadId = urlParts[urlParts.length - 1];
    
    if (!threadId || threadId === '[threadId]') {
      return new Response(JSON.stringify({ 
        error: 'Thread ID is required',
        code: 'INVALID_REQUEST'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }

    // Delete thread from OpenAI
    const openaiThread = await openai.beta.threads.retrieve(threadId);
    
    // Delete thread reference from Supabase
    const { error: deleteError } = await supabase
      .from('chat_threads')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting thread reference from Supabase:', deleteError);
      // Continue anyway since OpenAI deletion succeeded
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to delete thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}