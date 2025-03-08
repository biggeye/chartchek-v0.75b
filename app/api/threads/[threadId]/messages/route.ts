// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getOpenAIClient } from '@/utils/openai/server';
import type { MessagePayload } from '@/types/store/document/index';

const openai = getOpenAIClient();

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

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    const requestData = await req.json();
    console.log('[POST] Request data:', JSON.stringify(requestData, null, 2));
    
    const { content, role = 'user', attachments = [], assistant_id } = requestData;
    
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

    // Build the payload according to OpenAI's format requirements
    const payload: MessagePayload = {
      role: "user",
      content: typeof content === 'string' ? content : JSON.stringify(content),
    };
console.log('[POST] ####### Stringified Payload:', JSON.stringify(payload, null, 2));
    // If attachments exist, map them into the expected structure.
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map((attachment: any) => {
        return {
          file_id: attachment.file_id,
          tools: attachment.tools || [{ type: 'file_search' }]
        };
      });
    }
    
    console.log('[POST] OpenAI payload:', JSON.stringify(payload, null, 2));

    // Create the message in OpenAI.
    const openAIMessage = await openai.beta.threads.messages.create(
      threadId,
      payload
    );
    const messageId = openAIMessage.id;
    
    // Store the standardized message format in Supabase
    const formattedContent = typeof content === 'string' 
      ? JSON.stringify({ text: content }) 
      : JSON.stringify(content);
      
    // Store a minimal reference in Supabase
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        user_id: userId,
        message_id: messageId,
        role: 'user',
        content: formattedContent,
        attachments: payload.attachments || null
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

export async function GET(req: NextRequest) {
  const { pathname, searchParams } = new URL(req.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];
  
  const supabase = await createServer();
  
  console.log(`[/api/threads/${threadId}/messages] Retrieving messages`);
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[GET] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    
    // Verify thread belongs to user
    const { data: threadData, error: threadError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single();
      
    if (threadError) {
      console.error('[GET] Thread not found or not authorized:', threadError.message);
      return NextResponse.json(
        { error: 'Thread not found or not authorized', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    // Parse query parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;
    const after = searchParams.get('after') || undefined;
    const before = searchParams.get('before') || undefined;
    const runId = searchParams.get('run_id') || undefined;
    
    let queryOptions: any = {};
    if (limit) queryOptions = { ...queryOptions, limit };
    if (order) queryOptions = { ...queryOptions, order };
    if (after) queryOptions = { ...queryOptions, after };
    if (before) queryOptions = { ...queryOptions, before };
    if (runId) queryOptions = { ...queryOptions, run_id: runId };
    
    // Get messages from OpenAI
    if (openai) {
      const messagesResponse = await openai.beta.threads.messages.list(
        threadId,
        Object.keys(queryOptions).length > 0 ? queryOptions : undefined
      );
      console.log('[GET] Retrieved messages:', messagesResponse.data.length);
      return NextResponse.json(messagesResponse);
    } else {
      throw new Error('OpenAI client not initialized');
    }
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
