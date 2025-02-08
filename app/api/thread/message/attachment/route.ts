import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { OpenAI } from "openai"
import type { ThreadMessageAttachmentRequest, ThreadMessageAttachmentResponse, ApiResponse } from '@/types/api/routes'
import type { Document } from '@/types/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 512 * 1024 * 1024 // 512MB

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createServer()

    // Authenticate user
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const requestData: ThreadMessageAttachmentRequest = {
      thread_id: formData.get('thread_id') as string,
      message_id: formData.get('message_id') as string,
      file_id: formData.get('file_id') as string
    }

    // Validate required fields
    if (!requestData.thread_id || !requestData.message_id || !file) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        code: 'INVALID_REQUEST'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({
        error: 'Invalid file type. Allowed types: ' + ALLOWED_FILE_TYPES.join(', '),
        code: 'INVALID_FILE_TYPE'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Verify user owns this thread
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .eq('thread_id', requestData.thread_id)
      .single()

    if (threadError || !thread) {
      return new Response(JSON.stringify({
        error: 'Thread not found or unauthorized',
        code: 'NOT_FOUND'
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Upload file to OpenAI
    const openAIFile = await openai.files.create({
      file,
      purpose: 'assistants'
    })

    // Store file in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        thread_id: requestData.thread_id,
        message_id: requestData.message_id,
        file_id: openAIFile.id,
        purpose: 'assistants',
        name: file.name,
        type: file.type,
        size: file.size,
        metadata: {
          original_name: file.name,
          content_type: file.type
        }
      })
      .select()
      .single()

    if (dbError) {
      // Clean up OpenAI file if database insert fails
      await openai.files.del(openAIFile.id)
      throw dbError
    }

    // Create a new message with the file content
    const newMessage = await openai.beta.threads.messages.create(
      requestData.thread_id,
      {
        role: "user",
        content: `[File Attached: ${file.name}]`,
        attachments: [{ file_id: openAIFile.id }]
      }
    )

    // Store the new message in database
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        thread_id: requestData.thread_id,
        message_id: newMessage.id,
        role: 'user',
        content: `[File Attached: ${file.name}]`,
        attachments: [openAIFile.id]
      })

    if (messageError) {
      console.error('[API] Failed to store message:', messageError)
    }

    const response: ApiResponse<ThreadMessageAttachmentResponse> = {
      success: true,
      document: document as Document
    }

    return new Response(JSON.stringify(response), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("[API] Error adding attachment to message:", error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'INTERNAL_ERROR'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}
