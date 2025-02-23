import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

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

    // Process input data
    const formData = await request.formData();
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined;
    const toolResources = formData.get('tool_resources') ? JSON.parse(formData.get('tool_resources') as string) : undefined;

    // Modify the thread using OpenAI's API
    const updatedThread = await openai.beta.threads.update(threadId, {
      metadata,
      tool_resources: toolResources
    });

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('[Modify Thread] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Modify operation failed',
        code: 'MODIFY_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}