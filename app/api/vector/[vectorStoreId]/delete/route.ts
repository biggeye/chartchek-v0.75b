// post function based on:

/*
Delete vector store
Beta
delete
 
https://api.openai.com/v1/vector_stores/{vector_store_id}
Delete a vector store.

Path parameters
vector_store_id
string

Required
The ID of the vector store to delete.

Returns
Deletion status

Example request
import OpenAI from "openai";
const openai = new OpenAI();

async function main() {
  const deletedVectorStore = await openai.beta.vectorStores.del(
    "vs_abc123"
  );
  console.log(deletedVectorStore);
}

main();
Response
{
  id: "vs_abc123",
  object: "vector_store.deleted",
  deleted: true
}
*/

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { openai as awaitOpenai } from '@/utils/openai';

export async function DELETE(
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

    // Delete the vector store using OpenAI's API
    const deletedVectorStore = await openai.beta.vectorStores.del(vectorStoreId);

    return NextResponse.json(deletedVectorStore);
  } catch (error) {
    console.error('[Delete Vector Store] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete operation failed',
        code: 'DELETE_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}