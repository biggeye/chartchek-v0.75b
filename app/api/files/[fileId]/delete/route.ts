import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function DELETE(request: NextRequest) {
  const { vector_store_id, file_id } = request.query;

  if (!vector_store_id || !file_id) {
    return NextResponse.json({ error: 'Missing vector_store_id or file_id' }, { status: 400 });
  }

  const openai = new OpenAI();

  try {
    const deletedVectorStoreFile = await openai.beta.vectorStores.files.del(vector_store_id, file_id);
    return NextResponse.json(deletedVectorStoreFile, { status: 200 });
  } catch (error) {
    console.error('Error deleting vector store file:', error);
    return NextResponse.json({ error: 'Failed to delete vector store file' }, { status: 500 });
  }
}
