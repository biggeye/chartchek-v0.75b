// app/api/gemini/chunk/create/route.ts

import { NextResponse } from 'next/server';
import { geminiCorpusService, Chunk } from '@/lib/gemini/corpus';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentName, chunk } = body;
    
    if (!documentName || !chunk) {
      return NextResponse.json(
        { error: 'documentName and chunk are required' },
        { status: 400 }
      );
    }
    
    const createdChunk = await geminiCorpusService.createChunk(documentName, chunk);
    return NextResponse.json(createdChunk);
  } catch (error: any) {
    console.error('Error creating chunk:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chunk' },
      { status: 500 }
    );
  }
}