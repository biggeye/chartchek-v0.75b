import { NextRequest } from 'next/server';
import { createServer } from "@/utils/supabase/server";
import { getOpenAIClient } from "@/utils/openai/server";
import type { ApiResponse } from '@/types/api/routes';

export async function POST(req: NextRequest): Promise<Response> {
  try {
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

    const { Function, Type, Components, Agency, Additional } = await req.json();

    const { data, error } = await supabase
      .from('store_new_function')
      .insert({
        function_name: Function,
        type: Type,
        components: Components,
        agency: Agency,
        additional: Additional
      });

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ 
        message: 'Error storing new function', 
        error: error.message 
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'New function stored successfully', data }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unexpected server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}