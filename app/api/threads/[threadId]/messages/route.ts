// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';
import type { MessagePayload } from '@/types/store/document/index';

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

  const supabase = await createServer();
  const openai = await awaitOpenai();

  console.log(`[/api/threads/${threadId}/messages] Received request to create message `);

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
    if (!content) {
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
      payload.attachments = attachments.map((attachment: any) => {
        const fileId = typeof attachment === 'object' && attachment.file_id ? attachment.file_id : attachment;
        return {
          file_id: fileId,
          tools: [{ type: "file_search" as const }],
        };
      });
    }

    console.log('[/api/threads/[threadId]/messages] Creating message in OpenAI with payload:', payload);
    const message = await openai.beta.threads.messages.create(threadId, payload);
    console.log(`[/api/threads/${threadId}/messages] Message created in OpenAI:`, message.id);

    // Save the message to Supabase.
    console.log(`[/api/threads/${threadId}/messages] Storing message in Supabase`);
    const { data: dbMessage, error: dbError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        thread_id: threadId,
        content: { text: content },
        attachments: message.attachments || [],
        role: 'user',
        message_id: message.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[/api/threads/${threadId}/messages] Supabase error:`, dbError);
      throw dbError;
    }
    
    console.log(`[/api/threads/${threadId}/messages] Message stored in Supabase:`, dbMessage.id);

    return NextResponse.json({
      messageId: message.id,
      message: dbMessage
    });
  } catch (error) {
    console.error('[POST] Error during message creation:', error);
    return NextResponse.json(
      { error: 'Message processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // ... existing GET handler code remains unchanged ...

  const { pathname } = new URL(request.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

  const supabase = await createServer();
  const openai = await awaitOpenai();

  console.log('[GET] Received request to list messages for thread:', threadId);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[GET] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

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

    // Extract and update attachments for each message
    for (const message of messages.data) {
      if (message.attachments && message.attachments.length > 0) {
        const attachments = message.attachments.map(file_id => ({
          file_id,
          tools: [
            { type: 'code_interpreter' },
            { type: 'file_search' }
          ]
        }));

        await supabase
          .from('chat_messages')
          .update({ attachments })
          .eq('message_id', message.id);
      }
    }

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
