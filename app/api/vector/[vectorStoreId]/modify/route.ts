// post function based on:

/*
Modify vector store
Beta
post
 
https://api.openai.com/v1/vector_stores/{vector_store_id}
Modifies a vector store.

Path parameters
vector_store_id
string

Required
The ID of the vector store to modify.

Request body
name
string or null

Optional
The name of the vector store.

expires_after
object

Optional
The expiration policy for a vector store.


Show properties
metadata
map

Optional
Set of 16 key-value pairs that can be attached to an object. This can be useful for storing additional information about the object in a structured format, and querying for objects via API or the dashboard.

Keys are strings with a maximum length of 64 characters. Values are strings with a maximum length of 512 characters.

Returns
The modified vector store object.

Example request
import { getOpenAIClient } from '@/utils/openai/server'
;
const openai = getOpenAIClient()


async function main() {
  const vectorStore = await openai.beta.vectorStores.update(
    "vs_abc123",
    {
      name: "Support FAQ"
    }
  );
  console.log(vectorStore);
}

main();
Response
{
  "id": "vs_abc123",
  "object": "vector_store",
  "created_at": 1699061776,
  "name": "Support FAQ",
  "bytes": 139920,
  "file_counts": {
    "in_progress": 0,
    "completed": 3,
    "failed": 0,
    "cancelled": 0,
    "total": 3
  }
}

*/

import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getOpenAIClient } from '@/utils/openai/server'
;

const openai = getOpenAIClient()

  

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const expiresAfter = formData.get('expires_after') ? JSON.parse(formData.get('expires_after') as string) : undefined;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined;

    // Modify the vector store using OpenAI's API
    const updatedVectorStore = await openai.beta.vectorStores.update(vectorStoreId, {
      name,
      expires_after: expiresAfter,
      metadata
    });

    return NextResponse.json(updatedVectorStore);
  } catch (error) {
    console.error('[Modify Vector Store] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Modify operation failed',
        code: 'MODIFY_OPERATION_FAILED'
      },
      { status: 500 }
    );
  }
}