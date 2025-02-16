import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai as awaitOpenai } from '@/utils/openai'

import type { ThreadMessageRequest, ThreadMessageResponse, ApiResponse } from '@/types/api/routes'
import type { FileAttachment, MessageFileAttachment } from '@/types/api/openai/tools'
import type { MessageRole } from '@/types/api/openai/messages'
import type { ChatMessage } from '@/types/database'


export async function POST(request: NextRequest): Promise<Response> {
  console.log('[/thread/message/route] POST request received');
  const openai = await awaitOpenai();
  try {
    const supabase = await createServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[/thread/message/route] Error:', authError || 'Unauthorized access');
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const formData = await request.formData()
    const fileQueue = formData.get('file_queue');
    const attachments = fileQueue && (fileQueue as string).trim() !== '' ? (fileQueue as string).split(',').map(fileId => ({
      file_id: fileId,
    })) : undefined;
    const threadId = formData.get('thread_id') as string;
    const role = formData.get('role') as MessageRole;
    const content = formData.get('content') as string;
    const annotations = formData.get('annotations') as string;

    console.log('[API] Form data extracted:', { threadId, role, content, annotations });

    const requestData = {
      user_id: user.id,
      thread_id: threadId,
      role: role,
      content: content,
      attachments: attachments,
      annotations: annotations
    }

    if (!requestData.thread_id) {
      console.error('[API] Missing required field: thread_id');
      return new Response(JSON.stringify({
        error: 'Missing required field: thread_id',
        code: 'INVALID_REQUEST'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add message to OpenAI thread
    const threadMessage = await openai.beta.threads.messages.create(
      requestData.thread_id,
      {
        role: requestData.role === 'assistant' ? 'user' : requestData.role,
        content: requestData.content,
        
     //     tools: attachment.tools
 
      }
    )
    console.log('[/thread/message/route] Created message with: ', requestData);
    if (!threadMessage?.id) {
      throw new Error("Failed to create message with OpenAI")
    }



    // Add message to database
    const chatMessage = {
      user_id: user.id,
      thread_id: requestData.thread_id,
      message_id: threadMessage.id,
      role: requestData.role,
      content: {
        text: {
          value: requestData.content,
          annotations: requestData.annotations
        }
      },
    }

    const { data: savedMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert(chatMessage)
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Update the chat_threads table with the created_at timestamp
    const { error: updateError } = await supabase
      .from('chat_threads')
      .update({ updated_at: savedMessage.created_at })
      .eq('thread_id', requestData.thread_id)

    if (updateError) {
      throw updateError
    }

    const response: ApiResponse<ThreadMessageResponse> = {
      message: savedMessage
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[/api/thread/message] Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR'
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}