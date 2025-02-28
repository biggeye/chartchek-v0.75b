// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import OpenAI from "openai"
import type { MessagePayload } from '@/types/store/document/index';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
}); 


export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

  const supabase = await createServer();

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
        return {
          file_id: attachment.file_id,
          tools: attachment.tools || [{ type: 'file_search' }]
        };
      });
    }

    // Create the message in OpenAI.
    const openAIMessage = await openai.beta.threads.messages.create(
      threadId,
      payload
    );
    const messageId = openAIMessage.id;
    // Store a minimal reference in Supabase
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        user_id: userId,
        message_id: messageId,
        role: 'user',
        attachments: payload.attachments
      });

    if (insertError) {
      console.error('[POST] Error storing message reference:', insertError);
      // Continue anyway since the message was created in OpenAI
    }

    return NextResponse.json(openAIMessage);
  } catch (error) {
    console.error('[POST] Error during message creation:', error);
    return NextResponse.json(
      { error: 'Message processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

  const supabase = await createServer();

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
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const order = searchParams.get('order') || 'desc';
    const after = searchParams.get('after');
    const before = searchParams.get('before');
    const runId = searchParams.get('run_id');

    console.log('[GET] Query parameters:', { limit, order, after, before, runId });

    // Fetch messages from OpenAI using pagination options correctly
    // Note: The SDK only accepts valid options through its query parameter
    let queryOptions = {};
    
    // Only add parameters that are defined and valid for the OpenAI API
    if (after) queryOptions = { ...queryOptions, after };
    if (before) queryOptions = { ...queryOptions, before };
    if (runId) queryOptions = { ...queryOptions, run_id: runId };
    
    // Get messages from OpenAI
    const messagesResponse = await openai.beta.threads.messages.list(
      threadId,
      Object.keys(queryOptions).length > 0 ? queryOptions : undefined
    );
    
    console.log('[GET] Retrieved messages:', messagesResponse.data.length);
    
    // Return the OpenAI messages directly
    return NextResponse.json(messagesResponse);
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
