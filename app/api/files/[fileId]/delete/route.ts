import { NextRequest, NextResponse } from 'next/server';
import { useOpenAI } from '@/lib/contexts/OpenAIProvider'

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vector_store_id = searchParams.get('vector_store_id');
  const file_id = searchParams.get('file_id');

  if (!vector_store_id || !file_id) {
    return NextResponse.json({ error: 'Missing vector_store_id or file_id' }, { status: 400 });
  }

  const { openai, isLoading, error } = useOpenAI()

  try {
    const deletedVectorStoreFile = await openai!.beta.vectorStores.files.del(vector_store_id, file_id);
    return NextResponse.json(deletedVectorStoreFile, { status: 200 });
  } catch (error) {
    console.error('Error deleting vector store file:', error);
    return NextResponse.json({ error: 'Failed to delete vector store file' }, { status: 500 });
  }
}