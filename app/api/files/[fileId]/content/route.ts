import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"
import { useOpenAI } from '@/lib/contexts/OpenAIProvider'
import type { ThreadListResponse, ApiResponse } from '@/types/api/routes'

const { openai, isLoading, error } = useOpenAI()
  

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
    const openai_file_id = urlParts[urlParts.length - 1]; // Extract threadId from the URL path

    const file: any = await openai!.files.content(`file-${openai_file_id}`);

    return new Response(file, { 
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