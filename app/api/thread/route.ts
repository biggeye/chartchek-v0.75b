import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { openai as awaitOpenai } from '@/utils/openai'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'
import type { ChatThread } from '@/types/database'


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
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    // Get threads from database
    const { data: threads, error: threadsError, count } = await supabase
      .from('chat_threads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (threadsError) {
      throw threadsError
    }

    const response: ApiResponse<ThreadListResponse> = {
      threads: threads as ChatThread[],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      }
    }

    return new Response(JSON.stringify(response), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('[/api/thread] Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to list threads',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}