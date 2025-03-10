import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/utils/openai/server';

export async function PATCH(request: Request) {
  try {
    // Try to get the OpenAI client, but handle the error gracefully
    let openaiClient;
    try {
      openaiClient = getOpenAIClient();
    } catch (error) {
      console.error('[metadata:PATCH] OpenAI client initialization failed:', error);
      return NextResponse.json(
        { error: 'OpenAI service unavailable. Please check your API key configuration.' },
        { status: 503 }
      );
    }

    if (!openaiClient) {
      return NextResponse.json(
        { error: 'OpenAI client not initialized' },
        { status: 500 }
      );
    }

    // Extract threadId from URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    // In the path /api/threads/[threadId]/metadata, threadId is at index 3
    const threadId = segments[3];

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { metadata } = body;

    if (!metadata || typeof metadata !== 'object') {
      return NextResponse.json(
        { error: 'Metadata object is required' },
        { status: 400 }
      );
    }

    try {
      const updatedThread = await openaiClient.beta.threads.update(
        threadId,
        { metadata }
      );

      return NextResponse.json({
        success: true,
        thread: updatedThread
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

      console.error('[metadata:PATCH] OpenAI API error:', {
        status: error?.status,
        message: error?.message,
        type: error?.type
      });

      return NextResponse.json(
        { error: error?.message || 'Failed to update thread metadata' },
        { status: error?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('[metadata:PATCH] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
