// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';
import type { MessagePayload } from '@/types/store/document/index';

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const supabase = await createServer();
  const openai = await awaitOpenai();

  // Grab the threadId from params
  const { threadId } = params;
  console.log('[POST] Received request to create message in thread:', threadId);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    if (authError || !user) {
      console.error('[POST] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { content, attachments } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID required' },
        { status: 400 }
      );
    }

    // Build the payload.
    const payload: MessagePayload = {
      role: "user",
      content,
    };

    // If attachments exist, map them into the expected structure.
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      // Note: Ensure the tool type is the literal "file_search"
      payload.attachments = attachments.map((fileId: string) => ({
        file_id: fileId,
        tools: [{ type: "file_search" as const }],
      }));
    }

    // Create the message using OpenAI API.
    const message = await openai.beta.threads.messages.create(threadId, payload);

    // Save the message to Supabase.
    const { error: dbError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        thread_id: threadId,
        content: { text: content },
        file_ids: attachments || [],
        role: 'user',
        message_id: message.id,
      });

    if (dbError) throw dbError;
    console.log('[POST] Message stored in Supabase');

    return NextResponse.json(message);
  } catch (error) {
    console.error('[POST] Error during message creation:', error);
    return NextResponse.json(
      { error: 'Message processing failed' },
      { status: 500 }
    );
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const supabase = await createServer();
  const openai = await awaitOpenai();

  console.log('[GET] Received request to list messages for thread:', params.threadId);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[GET] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const threadId = params.threadId;
    if (!threadId) {
      console.error('[GET] Missing thread ID');
      return NextResponse.json(
        { error: 'Thread ID required', code: 'THREAD_ID_MISSING' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const order = searchParams.get('order') || 'desc';
    const after = searchParams.get('after');
    const before = searchParams.get('before');
    const runId = searchParams.get('run_id');

    console.log('[GET] Query parameters:', { limit, order, after, before, runId });

    const messages = await openai.beta.threads.messages.list(threadId);
    console.log('[GET] Retrieved messages:', messages);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[GET] Error during message listing:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'List messages operation failed',
        code: 'LIST_MESSAGES_FAILED'
      },
      { status: 500 }
    );
  }
}
