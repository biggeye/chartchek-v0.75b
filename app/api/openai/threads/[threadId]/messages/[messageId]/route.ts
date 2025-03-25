// app/api/threads/[threadId]/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServer } from '@/utils/supabase/server'
import { getOpenAIClient } from '@/utils/openai/server'

const openai = getOpenAIClient()

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Extract params from URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    
    // In the path /api/threads/[threadId]/messages/[messageId], 
    // threadId is at index 3 and messageId is at index 5
    const threadId = segments[3];
    const messageId = segments[5];

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