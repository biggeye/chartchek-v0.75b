import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function DELETE(request: NextRequest) {
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

    // Delete message using OpenAI's API
    const deletedMessage = await openai.beta.threads.messages.del(threadId, messageId);

    return NextResponse.json(deletedMessage);
  } catch (error) {
    console.error('[Delete Message] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete operation failed',
        code: 'DELETE_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}