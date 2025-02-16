import { NextRequest } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { openai as awaitOpenAi } from '@/utils/openai'
import type { ThreadCreateRequest, ThreadCreateResponse, ApiResponse } from '@/types/api/routes'
import type { ChatThread, ChatMessage } from '@/types/database'

export async function POST(request: NextRequest): Promise<Response> {
  const openai = await awaitOpenAi();
  try {
    const supabase = await createServer()

    // Verify user is authenticated
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

    const json = await request.json();
    const requestData: ThreadCreateRequest = {
      user_id: user.id,
      assistant_id: json.assistantId,
      title: json.title,
      metadata: json.metadata,
      initial_message: json.initial_message
    };

    // Debugging: Log the openai instance to inspect its structure

    // Create thread with OpenAI
    const thread = await openai.beta.threads.create(requestData.initial_message ? {
      messages: [{
        role: "user",
        content: requestData.initial_message
      }]
    } : undefined)

    console.log('[API] Created thread:', thread.id)
    const threadId = thread.id
    if (!requestData.initial_message) {
    return new Response(JSON.stringify({ thread_id: threadId}))
    }
    // Store thread in database
    const chatThread: Omit<ChatThread, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      thread_id: thread.id,
      assistant_id: requestData.assistant_id,
      title: requestData.title || 'New Chat',
      last_message_at: new Date().toISOString(),
      is_active: true,
      metadata: requestData.metadata
    }

    const { data: insertedThread, error: threadError } = await supabase
      .from('chat_threads')
      .insert(chatThread)
      .select()
      .single()

    if (threadError) {
      // Clean up OpenAI thread if database insert fails
      await openai.beta.threads.del(thread.id)
      throw threadError
    }

    let initialMessage: ChatMessage | undefined
    if (requestData.initial_message) {
      // Store initial message in database
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          thread_id: thread.id,
          role: 'user',
          content: requestData.initial_message,
          metadata: requestData.metadata
        })
        .select()
        .single()

      if (messageError) {
        throw messageError
      }
      initialMessage = message as ChatMessage
    }

    const response: ApiResponse<ThreadCreateResponse> = {
      thread: insertedThread as ChatThread,
      message: initialMessage
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[/api/thread/create] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create thread',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}