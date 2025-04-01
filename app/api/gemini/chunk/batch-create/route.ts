// app/api/gemini/chunk/batch-create/route.ts

import { NextResponse } from 'next/server';
import { geminiCorpusService, Chunk } from '@/lib/gemini/corpus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentName, chunks } = body;
    
    if (!documentName || !chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'documentName and chunks array are required' },
        { status: 400 }
      );
    }
    
    const result = await geminiCorpusService.batchCreateChunks(documentName, chunks);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error batch creating chunks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch create chunks' },
      { status: 500 }
    );
  }
}