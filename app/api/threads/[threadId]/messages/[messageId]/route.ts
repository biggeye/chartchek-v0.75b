// app/api/threads/[threadId]/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { openai } from '@/utils/openai'

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const pathSegments = pathname.split('/');
  const threadId = pathSegments[pathSegments.length - 3];
  const messageId = pathSegments[pathSegments.length - 1];

  const supabase = await createServer();
  

  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate threadId and messageId
    if (!threadId || !messageId) {
      return NextResponse.json(
        { error: 'Thread ID and Message ID required', code: 'ID_MISSING' },
        { status: 400 }
      );
    }

    // Retrieve message using OpenAI's API
    const message = await openai.beta.threads.messages.retrieve(threadId, messageId);

    return NextResponse.json(message);
  } catch (error) {
    console.error('[Retrieve Message] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Retrieve operation failed',
        code: 'RETRIEVE_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}
