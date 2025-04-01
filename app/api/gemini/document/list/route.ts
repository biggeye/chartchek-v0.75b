// app/api/gemini/document/list/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpus';
import { createServer } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const corpusName = searchParams.get('corpusName');
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50;
    const pageToken = searchParams.get('pageToken') || undefined;
    
    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }
    
    // List documents from Gemini
    const result = await geminiCorpusService.listDocuments(corpusName, pageSize, pageToken);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list documents' },
      { status: 500 }
    );
  }
}