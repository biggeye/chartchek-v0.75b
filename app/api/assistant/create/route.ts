import { NextRequest } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { OpenAI } from 'openai'
import type { AssistantCreateRequest, AssistantCreateResponse, ApiResponse } from '@/types/api/routes'
import type { UserAssistant } from '@/types/database'
import type { Assistant } from '@/types/api/openai'

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
    const requestData: AssistantCreateRequest = {
      name: formData.get('name') as string,
      instructions: formData.get('instructions') as string,
      tools: JSON.parse(formData.get('tools') as string),
      model: formData.get('model') as string,
      description: formData.get('description') as string || undefined,
      metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined,
      file_ids: formData.get('file_ids') ? JSON.parse(formData.get('file_ids') as string) : undefined
    }

    // Validate required fields
    if (!requestData.name || !requestData.instructions || !requestData.tools || !requestData.model) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields', 
        code: 'INVALID_REQUEST' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if assistant already exists for this user
    const { data: existingAssistant, error: queryError } = await supabase
      .from('user_assistants')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', requestData.name)
      .eq('is_active', true)
      .single()

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw queryError
    }

    if (existingAssistant) {
      const assistant = await openai.beta.assistants.retrieve(existingAssistant.assistant_id)
      const response: ApiResponse<AssistantCreateResponse> = {
        assistant: {
          id: assistant.id,
          object: 'assistant',
          name: assistant.name,
          description: assistant.description,
          model: assistant.model,
          instructions: assistant.instructions,
          tools: assistant.tools,
          vector_store_id: assistant.tool_resources?.file_search?.vector_store_ids,
          metadata: assistant.metadata
        } as Assistant,
        userAssistant: existingAssistant as UserAssistant
      }
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create new assistant
    const assistant = await openai.beta.assistants.create({
      name: requestData.name,
      instructions: requestData.instructions,
      model: requestData.model,
      description: requestData.description,
      metadata: requestData.metadata,
    })

    // Store assistant in database
    const userAssistant: Omit<UserAssistant, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      assistant_id: assistant.id,
      name: assistant.name || requestData.name,
      description: assistant.description || requestData.description,
      instructions: assistant.instructions || requestData.instructions,
      model: assistant.model,
      vector_store_id: assistant.tool_resources?.file_search?.vector_store_ids || [],
      metadata: assistant.metadata || requestData.metadata,
      is_active: true
    }

    const { data: insertedAssistant, error: insertError } = await supabase
      .from('user_assistants')
      .insert(userAssistant)
      .select()
      .single()

    if (insertError) {
      // Clean up OpenAI assistant if database insert fails
      await openai.beta.assistants.del(assistant.id)
      throw insertError
    }

    const response: ApiResponse<AssistantCreateResponse> = {
      assistant: {
        id: assistant.id,
        object: 'assistant',
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools,
        vector_store_id: assistant.tool_resources?.file_search?.vector_store_ids,
        metadata: assistant.metadata
      } as Assistant,
      userAssistant: insertedAssistant as UserAssistant
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[/api/assistant/create] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create assistant',
      code: 'INTERNAL_ERROR',
      status: 500
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
