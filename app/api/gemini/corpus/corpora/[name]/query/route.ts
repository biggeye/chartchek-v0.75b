// app/api/gemini/corpus/query/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpusService/';
import { createServer } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { corpusName, query, metadataFilters, resultsCount = 10 } = await request.json();

    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    // Query corpus in Gemini
    const results = await geminiCorpusService.queryCorpus(
      corpusName,
      query,
      metadataFilters,
      resultsCount
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error querying corpus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query corpus' },
      { status: 500 }
    );
  }
}