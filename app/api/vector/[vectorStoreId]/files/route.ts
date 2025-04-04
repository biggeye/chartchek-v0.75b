// api/vector/[vectorStoreId]/files/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/utils/ai/openai/server';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const segments = pathname.split('/');
  const vectorStoreId = segments[segments.indexOf('vector') + 1];

  if (!vectorStoreId) {
    return NextResponse.json(
      { error: 'Vector store ID is required' },
      { status: 400 }
    );
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.beta.vectorStores.files.list(vectorStoreId);

    const fileIds = response.data.map((file: any) => file.id);
    console.log('[vector/files api route]: ', fileIds);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[vector/files api route] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list vector store files' },
      { status: 500 }
    );
  }
}