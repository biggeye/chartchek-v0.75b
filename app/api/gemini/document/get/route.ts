// app/api/gemini/document/get/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpusService/';
import { createServer } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const documentName = searchParams.get('documentName');
    
    if (!documentName) {
      return NextResponse.json(
        { error: 'documentName is required' },
        { status: 400 }
      );
    }
    
    // Get document from Gemini
    const document = await geminiCorpusService.getDocument(documentName);
    
    return NextResponse.json(document);
  } catch (error: any) {
    console.error('Error getting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get document' },
      { status: 500 }
    );
  }
}