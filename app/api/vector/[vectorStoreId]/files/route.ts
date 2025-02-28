// api/vector/[vectorStoreId]/files/route.ts

import OpenAI from "openai";
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const { pathname } = new URL(req.url);
  const vectorStoreId = pathname.split('/').slice(-2, -1)[0];

  if (!vectorStoreId) {
    return NextResponse.json({ error: 'Missing vectorStoreId' }, { status: 400 });
  }

  try {
    const response = await openai.beta.vectorStores.files.list(vectorStoreId!);

    const fileIds = response.data.map((file: any) => file.id);
    console.log('[vector/files api route]: ', fileIds);
    return NextResponse.json({ fileIds });
  } catch (error) {
    console.error('Error listing vector store files:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}