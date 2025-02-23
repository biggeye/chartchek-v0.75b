import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;
  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
  }
  const openai = await awaitOpenai();
  try {
    const supabase = await createServer();
  

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Delete the thread using OpenAI's API
    await openai.beta.threads.del(threadId);

    return NextResponse.json({ message: 'Thread deleted successfully' }, { status: 200 });
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