// app/api/gemini/corpus/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpusService/';
import { createServer } from '@/utils/supabase/server';
import { Corpus } from '@/types/store/doc/knowledgeBase';

export async function GET() {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get corpora from Gemini API
    const geminiResponse = await geminiCorpusService.listCorpora();
    const corpora = geminiResponse.corpora || [];
    console.log('[API] Corpora: ', corpora);
    if (!corpora.length) {
      return NextResponse.json({ corpora: [] });
    }

    // Get all corpus descriptions from Supabase
    const { data: supabaseCorpora } = await supabase
      .from('knowledge_corpus')
      .select('corpus_name, description');
    
    // Create a map for quick lookup
    const corpusDescMap = new Map();
    if (supabaseCorpora) {
      supabaseCorpora.forEach(item => {
        corpusDescMap.set(item.corpus_name, {
          description: item.description,
        });
      });
    }
    
    // Enhance Gemini corpora with Supabase data
    const enhancedCorpora = corpora.map((corpus: Corpus) => {
      const supabaseData = corpusDescMap.get(corpus.name) || {};
      return {
        ...corpus,
        description: supabaseData.description || null
      };
    });
   console.log('[API] Enhanced Corpora: ', enhancedCorpora);
    return NextResponse.json({ corpora: enhancedCorpora });
  } catch (error: any) {
    console.error('Error listing corpora:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list corpora' },
      { status: 500 }
    );
  }
}