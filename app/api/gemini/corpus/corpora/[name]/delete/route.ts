// app/api/gemini/corpus/[name]/delete/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpusService';
import { createServer } from '@/utils/supabase/server';

export async function DELETE(
  request: Request,
 // context: { params: { corpusName: string } }
) {

//    const params = await Promise.resolve(context.params);
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
 //   const corpusName = params.corpusName;

    if (!request) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }

    // Delete corpus in Gemini
   // const results = await geminiCorpusService.deleteCorpus(corpusName);

    // Also delete from Supabase
    await supabase
      .from('knowledge_corpus')
      .delete()
      .eq('corpus_name', 123);

    return NextResponse.json({ success: true, message: 'Corpus deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting corpus:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete corpus' },
      { status: 500 }
    );
  }
}