import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vector_store_id = searchParams.get('vector_store_id');
  const file_id = searchParams.get('file_id');
  const modifications = await request.json(); // Assuming modifications are sent in the request body

  if (!vector_store_id || !file_id || !modifications) {
    return NextResponse.json({ error: 'Missing vector_store_id, file_id, or modifications' }, { status: 400 });
  }

  const openai = new OpenAI();

  try {
    const modifiedVectorStoreFile = await openai.beta.vectorStores.files.modify(vector_store_id, file_id, modifications);
    return NextResponse.json(modifiedVectorStoreFile, { status: 200 });
  } catch (error) {
    console.error('Error modifying vector store file:', error);
    return NextResponse.json({ error: 'Failed to modify vector store file' }, { status: 500 });
  }
}