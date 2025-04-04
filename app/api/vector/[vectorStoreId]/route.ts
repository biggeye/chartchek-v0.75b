// GET function utilizes following logic:
/*
Retrieve vector store
Beta
get
 
https://api.openai.com/v1/vector_stores/{vector_store_id}
Retrieves a vector store.

Path parameters
vector_store_id
string

Required
The ID of the vector store to retrieve.

Returns
The vector store object matching the specified ID.

Example request
import { getOpenAIClient } from '@/utils/openai/server'
;
const openai = getOpenAIClient()


async function main() {
  const vectorStore = await openai.beta.vectorStores.retrieve(
    "vs_abc123"
  );
  console.log(vectorStore);
}

main();
Response
{
  "id": "vs_abc123",
  "object": "vector_store",
  "created_at": 1699061776
}
  */



// and the POST function utilizes the following logic:


import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getOpenAIClient } from '@/utils/ai/openai/server'
;

const openai = getOpenAIClient()

  

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const vectorStoreId = pathname.split('/').slice(-2, -1)[0];

  if (!vectorStoreId) {
    return NextResponse.json({ error: 'Missing vectorStoreId' }, { status: 400 });
  }

  try {
    const supabase = await createServer();


    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
    return NextResponse.json(vectorStore);
  } catch (error) {
    console.error('[Retrieve Vector Store] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Retrieve operation failed',
        code: 'RETRIEVE_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const vectorStoreId = pathname.split('/').slice(-2, -1)[0];

  if (!vectorStoreId) {
    return NextResponse.json({ error: 'Missing vectorStoreId' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const expiresAfter = formData.get('expires_after') ? JSON.parse(formData.get('expires_after') as string) : undefined;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined;

    const updatedVectorStore = await openai.beta.vectorStores.update(vectorStoreId, {
      name,
      expires_after: expiresAfter,
      metadata
    });

    return NextResponse.json(updatedVectorStore);
  } catch (error) {
    console.error('Error modifying vector store:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Modify operation failed',
        code: 'MODIFY_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}
