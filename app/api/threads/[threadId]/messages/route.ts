// app/api/threads/[threadId]/messages/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is imported if used for message_id

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  // Correctly get threadId from the dynamic segment
  const segments = pathname.split('/');
  const threadId = segments[segments.length - 2]; // Get the segment before 'messages'

  const supabase = await createServer();

  console.log(`[/api/threads/${threadId}/messages] Received request to create message`);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const userId = user?.id;
  try {

    if (!user) {
      console.error('[POST] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const payload = await req.json();
    console.log('[POST] Request data:', payload);

    // Validate payload
    if (!payload.role || !payload.content || !threadId) { // Validate threadId from URL, not payload necessarily
      console.error('[POST] Invalid payload or missing thread ID:', payload);
      return NextResponse.json(
        { error: 'Invalid request data', code: 'INVALID_PAYLOAD' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.log('no user ID for supabase insert');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId, // Use threadId from URL params
        user_id: userId,
        message_id: payload.message_id || uuidv4(), // Generate if not provided
        role: payload.role,
        content: payload.content,
        // You might want to add vendor/model here if tracking per message
        // vendor: payload.vendor,
        // model: payload.model,
      });

    if (insertError) {
      console.error('[POST] Error storing message reference:', insertError);
      // --- FIX: Return an error response ---
      return NextResponse.json(
        { error: 'Failed to store message', code: 'DB_INSERT_ERROR', details: insertError.message },
        { status: 500 }
      );
      // ------------------------------------
    } else {
      // On success, return confirmation
      console.log('[POST] Message stored successfully');
      return NextResponse.json({ status: 200, message: 'Message created successfully' });
    }
  } catch (error: any) {
    console.error('[POST] Error during message creation:', error);
    // Handle JSON parsing errors or other unexpected issues
    const statusCode = typeof error.status === 'number' ? error.status : 500;
    return NextResponse.json(
      {
        error: error.message || 'Message processing failed',
        code: error.code || 'MESSAGE_CREATION_FAILED'
      },
      { status: statusCode }
    );
  }
}

// --- GET function remains the same ---
export async function GET(
  request: NextRequest
) {
  try {
    // Try to get the AI provider, but handle the error gracefully
    try {
      // AI Provider initialization removed as it's not used here for getting messages
    } catch (error) {
      console.error('[messages:GET] AI provider initialization failed:', error);
      return NextResponse.json(
        { error: 'AI service unavailable. Please check your configuration.' },
        { status: 503 } // Service Unavailable
      );
    }

    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    const threadId = segments[segments.length - 2]; // Get threadId

    const supabase = await createServer();

    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate threadId
    if (!threadId) {
        return NextResponse.json(
            { error: 'Thread ID is required', code: 'MISSING_THREAD_ID' },
            { status: 400 }
        );
    }

    console.log(`[/api/threads/${threadId}/messages] GET request for user ${user.id}`);

    // Fetch messages for the specified thread and user
    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id) // Ensure user can only fetch their messages for the thread
      .order('created_at', { ascending: true }); // Order messages chronologically

    if (messagesError) {
        console.error(`[GET] Error fetching messages for thread ${threadId}:`, messagesError);
        return NextResponse.json(
            { error: 'Failed to retrieve messages', code: 'DB_FETCH_ERROR', details: messagesError.message },
            { status: 500 }
        );
    }

    // Check if any messages were found (optional, could return empty array)
    if (!messagesData || messagesData.length === 0) {
      console.log(`[GET] No messages found for thread ${threadId} for user ${user.id}`);
       // Decide whether to return 404 or 200 with empty array. 200 is usually preferred.
       return NextResponse.json([]); // Return empty array if no messages found
    }

    console.log(`[GET] Found ${messagesData.length} messages for thread ${threadId}`);
    return NextResponse.json(messagesData);

  } catch (error: any) {
    // Log the error for debugging
    console.error('[messages:GET] Server error:', error);
    const statusCode = typeof error.status === 'number' ? error.status : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: statusCode }
    );
  }
}