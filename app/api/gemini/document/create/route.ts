// app/api/gemini/document/create/route.ts
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
    const { corpusName, document } = await request.json();
    
    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }
    
    if (!document || !document.displayName || !document.content) {
      return NextResponse.json(
        { error: 'document with displayName and content is required' },
        { status: 400 }
      );
    }
    
    // Create document in Gemini
    const createdDocument = await geminiCorpusService.createDocument(corpusName, document);
    
    // Store in Supabase
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        corpus_id: corpusName,
        document_name: createdDocument.document_name,
        original_file_name: document.original_filename,
        created_by: session.user.id
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    );
  }
}