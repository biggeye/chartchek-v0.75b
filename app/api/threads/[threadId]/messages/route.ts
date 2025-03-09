// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getOpenAIClient, OPENAI_ASSISTANT_ID } from '@/utils/openai/server';
import type { MessagePayload } from '@/types/store/document/index';

// Initialize OpenAI client with error handling
const initializeOpenAI = () => {
  try {
    return getOpenAIClient();
  } catch (error) {
    console.error('[OpenAI] Client initialization failed:', error);
    return null;
  }
};

const openai = initializeOpenAI();

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];
  const supabase = await createServer();

  console.log(`[/api/threads/${threadId}/messages] Received request to create message`);

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
      console.error('[POST] OpenAI client not initialized');
      return NextResponse.json(
        { error: 'OpenAI service unavailable', code: 'OPENAI_CLIENT_ERROR' },
        { status: 503 }
      );
    }

    const requestData = await req.json();
    console.log('[POST] Request data:', JSON.stringify(requestData, null, 2));
    
    const { content, role = 'user', attachments = [], assistant_id = OPENAI_ASSISTANT_ID } = requestData;
    
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

    // If attachments exist, map them into the expected structure.
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map((attachment: any) => ({
        file_id: attachment.file_id,
        tools: attachment.tools || [{ type: 'file_search' }]
      }));
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
  } catch (error: any) {
    console.error('[POST] Error during message creation:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Message processing failed',
        code: error.code || 'MESSAGE_CREATION_FAILED'
      },
      { status: error.status || 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const openai = await getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client not initialized' },
        { status: 500 }
      );
    }

    const { threadId } = params;
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    try {
      const messages = await openai.beta.threads.messages.list(threadId);
      return NextResponse.json({
        data: messages.data,
        has_more: messages.has_more,
        next_page: messages.data.length > 0 ? messages.data[messages.data.length - 1].id : null
      });
    } catch (error: any) {
      // Handle OpenAI API specific errors
      if (error?.status === 404) {
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      // Handle rate limiting
      if (error?.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Handle authentication errors
      if (error?.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your API key.' },
          { status: 401 }
        );
      }

      // Log the error for debugging
      console.error('[messages:GET] OpenAI API error:', {
        status: error?.status,
        message: error?.message,
        type: error?.type
      });

      return NextResponse.json(
        { error: error?.message || 'Failed to fetch messages' },
        { status: error?.status || 500 }
      );
    }
  } catch (error: any) {
    // Log the error for debugging
    console.error('[messages:GET] Server error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
