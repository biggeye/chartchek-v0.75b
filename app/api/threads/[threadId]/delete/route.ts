import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const supabase = await createServer();
  const openai = await awaitOpenai();

  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Delete the thread using OpenAI's API
    const response = await openai.beta.threads.del(params.threadId);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[DELETE Thread] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete operation failed',
        code: 'DELETE_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}