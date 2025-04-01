// app/api/gemini/corpus/create/route.ts (updated)
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpus';
import { createServer } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { displayName, description } = await request.json();

    if (!displayName) {
      return NextResponse.json(
        { error: 'displayName is required' },
        { status: 400 }
      );
    }

    // Create corpus in Gemini (no need to pass accessToken anymore)
    const corpus = await geminiCorpusService.createCorpus(displayName);

    // Store in Supabase
    const { data, error } = await supabase
      .from('knowledge_corpus')
      .insert({
        corpus_name: corpus.name,
        display_name: displayName,
        description: description || null,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating corpus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create corpus' },
      { status: 500 }
    );
  }
}