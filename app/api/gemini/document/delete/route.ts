// app/api/gemini/document/delete/route.ts
import { NextResponse } from 'next/server';
import { geminiCorpusService } from '@/lib/gemini/corpus';
import { createServer } from '@/utils/supabase/server';

export async function DELETE(request: Request) {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentName } = await request.json();
    
    if (!documentName) {
      return NextResponse.json(
        { error: 'documentName is required' },
        { status: 400 }
      );
    }
    
    // Delete document from Gemini
    await geminiCorpusService.deleteDocument(documentName);
    
    // Delete from Supabase
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('document_name', documentName);
      
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}