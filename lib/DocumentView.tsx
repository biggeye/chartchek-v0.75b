// app/api/gemini/document/create/route.ts
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
    const requestData = await request.json();
    
    // Validate required fields
    const { corpusName, document } = requestData;
    
    if (!corpusName || !document || !document.displayName || !document.content) {
      return NextResponse.json(
        { error: 'Missing required fields: corpusName, document.displayName, document.content' },
        { status: 400 }
      );
    }

    // Create document in Gemini
    const createdDocument = await geminiCorpusService.createDocument(
      corpusName,
      document.displayName,
      document.content
    );

    // Store document reference in Supabase
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        corpus_name: corpusName,
        document_name: createdDocument.name,
        display_name: document.displayName,
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