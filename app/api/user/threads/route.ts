import { NextRequest } from 'next/server'
import { createServer } from "@/utils/supabase/server"

export async function GET(request: NextRequest): Promise<Response> {
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

  // Get userId from URL query params if provided, otherwise use authenticated user's ID
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || user.id;

  try {
    console.log('[/api/user/threads] Fetching threads for user:', userId);
    
    // Fetch chat threads
    const threads = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Fetch thread runs  
    const runs = await supabase
      .from('thread_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('[/api/user/threads] Response status:', 200);
    return new Response(JSON.stringify({
      threads: threads.data || [],
      runs: runs.data || []
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.log('[/api/user/threads] Response status:', 500);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve user thread data',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
