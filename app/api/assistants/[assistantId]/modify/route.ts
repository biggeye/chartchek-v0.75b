import { NextRequest } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { openai as awaitOpenai } from '@/utils/openai'
import type { AssistantUpdateRequest, AssistantUpdateResponse, ApiResponse } from '@/types/api/routes'
import type { UserAssistant } from '@/types/database'
import { Tool } from '@/types/api/openai'


export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createServer()
    const openai = await awaitOpenai()
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const requestData: AssistantUpdateRequest = {
      assistant_id: formData.get('assistant_id') as string,
      tool_resources: formData.get('tool_resources') ? JSON.parse(formData.get('tool_resources') as string) : undefined,
      tools: formData.get('tools') ? JSON.parse(formData.get('tools') as string) : undefined,
      name: formData.get('name') as string || undefined,
      description: formData.get('description') as string || undefined,
      instructions: formData.get('instructions') as string || undefined,
      model: formData.get('model') as string || undefined,
      metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined,
      is_active: formData.get('is_active') ? formData.get('is_active') === 'true' : undefined
    }

    if (!requestData.assistant_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: assistant_id', 
        code: 'INVALID_REQUEST' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify user owns this assistant
    const { data: existingAssistant, error: queryError } = await supabase
      .from('user_assistants')
      .select('*')
      .eq('user_id', user.id)
      .eq('assistant_id', requestData.assistant_id)
      .single()

    if (queryError || !existingAssistant) {
      return new Response(JSON.stringify({ 
        error: 'Assistant not found or unauthorized', 
        code: 'NOT_FOUND' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update OpenAI assistant
    const updateData: any = {}
    if (requestData.name) updateData.name = requestData.name
    if (requestData.description) updateData.description = requestData.description
    if (requestData.instructions) updateData.instructions = requestData.instructions
    if (requestData.tools) updateData.tools = requestData.tools
    if (requestData.model) updateData.model = requestData.model
    if (requestData.metadata) updateData.metadata = requestData.metadata
    if (requestData.tool_resources) {
      updateData.file_ids = existingAssistant.file_ids
      const retrievalTool: Tool = {
        type: "file_search"
      }
      updateData.tools = [
        ...(existingAssistant.tools || []).filter((t: Tool) => t.type !== 'file_search'),
        retrievalTool
      ]
      updateData.tool_resources = {
        file_search: {
          vector_store_ids: [requestData.tool_resources[0].file_search.vector_store_ids[0]]
        }
      }
    }

    const assistant = await openai.beta.assistants.update(
      requestData.assistant_id,
      updateData
    )

    // Update database record
    const userAssistantUpdate: Partial<UserAssistant> = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    if (requestData.is_active !== undefined) {
      userAssistantUpdate.is_active = requestData.is_active
    }


    const { data: updatedAssistant, error: updateError } = await supabase
      .from('user_assistants')
      .update(userAssistantUpdate)
      .eq('assistant_id', requestData.assistant_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    const response: ApiResponse<AssistantUpdateResponse> = {
      success: true,
      assistant: updatedAssistant
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[/api/assistant/update] Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR'
    }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}