// api/vector/[vectorStoreId]/files/route.ts

import { openai } from '@/utils/openai';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { vectorStoreId: string } }) {
const { vectorStoreId } = params;
  if (!vectorStoreId) {
    return NextResponse.json({ error: 'Missing vectorStoreId' }, { status: 400 });
  }

  try {

    const openaiClient = await openai();

    const response = await openaiClient.beta.vectorStores.files.list(vectorStoreId!);

    const fileIds = response.data.map((file: any) => file.id);
console.log('[vector/files api route]: ', fileIds);
    return NextResponse.json({ fileIds });
  } catch (error) {
    console.error('Error listing vector store files:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}