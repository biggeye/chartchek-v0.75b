import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai } from '@/utils/openai'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'



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
  const openaiClient = await openai();

  try {
    console.log('[/api/threads] Creating new thread for user:', user.id);
    const response = await openaiClient.beta.threads.create();  
    const threadId = response.id;
    console.log('[/api/threads] Thread created in OpenAI:', threadId);
    
    const { data: threadData, error: threadError } = await supabase.from('chat_threads').insert({
      user_id: user.id,
      thread_id: threadId
    })
    .select()
    .single();
    
    if (threadError) {
      console.error('[/api/threads] Error inserting thread in Supabase:', threadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save thread in database',
        code: 'DB_ERROR'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[/api/threads] Thread inserted in Supabase:', threadData);
    
    // Return with consistent key naming (threadId)
    return new Response(JSON.stringify({ 
      threadId: threadId,
      thread: threadData 
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
    
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch OpenAI thread data for each thread
    const openaiClient = await openai();
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        try {
          if (!thread.thread_id) return thread;
          
          const openaiThread = await openaiClient.beta.threads.retrieve(thread.thread_id);
          const threadWithResources = {
            ...thread,
            tool_resources: openaiThread.tool_resources || null
          };

          // Update the thread in Supabase with tool_resources
          const { error: updateError } = await supabase
            .from('chat_threads')
            .update({ tool_resources: openaiThread.tool_resources || null })
            .eq('id', thread.id);

          if (updateError) {
            console.error(`Error updating thread ${thread.id} in Supabase:`, updateError);
          }

          return threadWithResources;
        } catch (err) {
          console.error(`Error fetching OpenAI thread ${thread.thread_id}:`, err);
          return thread;
        }
      })
    );

    console.log('[/api/threads] Response status:', 200);
    return new Response(JSON.stringify(enrichedThreads), { 
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