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
import OpenAI from "openai";
const openai = new OpenAI();

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
import { openai as awaitOpenai } from '@/utils/openai';

export async function GET(
  request: NextRequest,
  { params }: { params: { vectorStoreId: string } }
) {
  const supabase = await createServer();
  const openai = await awaitOpenai();

  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Validate vectorStoreId
    const { vectorStoreId } = params;
    if (!vectorStoreId) {
      return NextResponse.json(
        { error: 'Vector Store ID required', code: 'ID_MISSING' },
        { status: 400 }
      );
    }

    // Retrieve the vector store using OpenAI's API
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
