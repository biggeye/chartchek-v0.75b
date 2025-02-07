import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { OpenAI } from "openai"
import type { ThreadMessageRequest, ThreadMessageResponse, ApiResponse } from '@/types/api/routes'
import type { ChatMessage } from '@/types/database'
import type { FileAttachment, MessageFileAttachment } from '@/types/api/openai/tools'
import type { MessageRole } from '@/types/api/openai/messages'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createServer()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const requestData: ThreadMessageRequest = {
      user_id: user.id,
      thread_id: formData.get('thread_id') as string,
      role: formData.get('role') as MessageRole,
      content: formData.get('content') as string,
      attachments: formData.get('attachments') ? JSON.parse(formData.get('attachments') as string) : undefined
    }

    if (!requestData.thread_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: thread_id', 
        code: 'INVALID_REQUEST' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    /* Verify user owns this thread
    const { data: thread, error: queryError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .eq('thread_id', requestData.thread_id)
      .single()

    if (queryError || !thread) {
      return new Response(JSON.stringify({ 
        error: 'Thread not found or unauthorized', 
        code: 'NOT_FOUND'
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }
*/
    // Add message to OpenAI thread
    const threadMessage = await openai.beta.threads.messages.create(
      requestData.thread_id,
      {
        role: requestData.role === 'assistant' ? 'user' : requestData.role,
        content: requestData.content,
        attachments: requestData.attachments?.map((attachment: FileAttachment): MessageFileAttachment => ({
          type: 'file',
          file_id: attachment.file_id
        })) || []
      }
    )

    if (!threadMessage?.id) {
      throw new Error("Failed to create message with OpenAI")
    }

    console.log('[API] Message created:', { 
      thread_id: requestData.thread_id,
      message_id: threadMessage.id
    })

    // Add message to database
    const chatMessage: Partial<ChatMessage> = {
      user_id: user.id,
      thread_id: requestData.thread_id,
      message_id: threadMessage.id,
      role: requestData.role,
      content: requestData.content,
    }

    const { data: savedMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert(chatMessage)
      .select()
      .single()

    if (insertError) {
      throw insertError
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
