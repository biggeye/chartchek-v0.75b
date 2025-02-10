import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { OpenAI } from "openai"
import { documentStore } from '@/store/documentStore';
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
    console.log('File queue:', documentStore.getState().fileQueue);
    const formData = await request.formData()
    console.log('Form data:', formData);
    const fileQueue = documentStore.getState().fileQueue;
    const attachments: FileAttachment[] = fileQueue.map(fileId => ({
      file_id: fileId,
      tools: [] // Add appropriate tools if needed
    }));
    const requestData: ThreadMessageRequest = {
      user_id: user.id,
      thread_id: formData.get('thread_id') as string,
      role: formData.get('role') as MessageRole,
      content: formData.get('content') as string,
      attachments: attachments,
      annotations: formData.get('annotations') ? JSON.parse(formData.get('annotations') as string) : undefined
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
    console.log('[ThreadMessage] Created message with: ', requestData);
    if (!threadMessage?.id) {
      throw new Error("Failed to create message with OpenAI")
    }



    // Add message to database
    const chatMessage: Partial<ChatMessage> = {
      user_id: user.id,
      thread_id: requestData.thread_id,
      message_id: threadMessage.id,
      role: requestData.role,
      content: {
        type: 'text',
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
