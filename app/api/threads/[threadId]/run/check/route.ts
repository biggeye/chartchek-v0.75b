import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/utils/openai/server';

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
      // Get the latest run for this thread
      const runs = await openai.beta.threads.runs.list(threadId);
      
      if (!runs.data || runs.data.length === 0) {
        return NextResponse.json(
          { error: 'No runs found for this thread' },
          { status: 404 }
        );
      }

      // Get the latest run
      const latestRun = runs.data[0];

      return NextResponse.json({
        status: latestRun.status,
        run_id: latestRun.id,
        thread_id: threadId,
        required_action: latestRun.required_action,
        last_error: latestRun.last_error,
        completed_at: latestRun.completed_at,
        expires_at: latestRun.expires_at
      });
    } catch (error: any) {
      // Handle OpenAI API specific errors
      if (error?.status === 404) {
        return NextResponse.json(
          { error: 'Thread or run not found' },
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

      console.error('[run/check:GET] OpenAI API error:', {
        status: error?.status,
        message: error?.message,
        type: error?.type
      });

      return NextResponse.json(
        { error: error?.message || 'Failed to check run status' },
        { status: error?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('[run/check:GET] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
