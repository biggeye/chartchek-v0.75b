// app/api/gemini/document/query/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService} from '@/lib/gemini/corpusService/';
import { createServer } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentName, query, metadataFilters, resultsCount = 10 } = await request.json();
    
    if (!documentName) {
      return NextResponse.json(
        { error: 'documentName is required' },
        { status: 400 }
      );
    }
    
    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }
    
    // Query document in Gemini
    const results = await geminiCorpusService.queryDocument(
      documentName,
      query,
      metadataFilters,
      resultsCount
    );
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error querying document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query document' },
      { status: 500 }
    );
  }
}