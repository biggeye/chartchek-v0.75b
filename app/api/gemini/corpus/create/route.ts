// app/api/gemini/corpus/create/route.ts (updated)
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpusService/';
import { createServer } from '@/utils/supabase/server';

// app/api/gemini/corpus/create/route.ts
export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, displayName, description } = await request.json();

    if (!displayName) {
      return NextResponse.json(
        { error: 'displayName is required' },
        { status: 400 }
      );
    }

    // Create corpus in Gemini (no need to pass accessToken anymore)
    const corpus = await geminiCorpusService.createCorpus(name, displayName);
    console.log('[API] corpus: ', corpus);
    // Store in Supabase but don't return that data
    const corpusSupabase = await supabase
      .from('knowledge_corpus')
      .insert({
        corpus_name: name,
        display_name: displayName,
        description: description || null,
        created_by: session.user.id
      });
     console.log('[API] corpus supabase: ', corpusSupabase)
    // Return the Gemini corpus data as the source of truth
    return NextResponse.json(corpus);
  } catch (error: any) {
    console.error('Error creating corpus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create corpus' },
      { status: 500 }
    );
  }
}