// app/api/threads/[threadId]/messages/[messageId]/metadata/route.ts
import { openai } from '@/utils/openai';
import { createServer } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

export const maxDuration = 60; // Max duration in seconds

/**
 * Updates message metadata in OpenAI
 * @route POST /api/threads/[threadId]/messages/[messageId]/metadata
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string; messageId: string } }
) {
  
  const supabase = await createServer();

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[API:updateMessageMetadata] Unauthorized access', authError);
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { threadId, messageId } = params;
    if (!threadId || !messageId) {
      console.error('[API:updateMessageMetadata] Missing required parameters');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { metadata } = await req.json();
    if (!metadata) {
      console.error('[API:updateMessageMetadata] Missing metadata in request body');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing metadata in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[API:updateMessageMetadata] Updating metadata for message ${messageId} in thread ${threadId}:`, metadata);

    // Update message metadata in OpenAI
    const updatedMessage = await openai.beta.threads.messages.update(
      threadId,
      messageId,
      { metadata }
    );

    console.log(`[API:updateMessageMetadata] Successfully updated message metadata for ${messageId}`);

    // Also update in Supabase for redundancy
    const { error: dbError } = await supabase
      .from('chat_messages')
      .update({ metadata })
      .eq('message_id', messageId);

    if (dbError) {
      console.warn('[API:updateMessageMetadata] Failed to update message metadata in Supabase:', dbError);
      // Don't fail - we've already succeeded with OpenAI
    } else {
      console.log('[API:updateMessageMetadata] Successfully synchronized metadata in Supabase');
    }

    return new Response(
      JSON.stringify({ success: true, message: updatedMessage }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API:updateMessageMetadata] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
