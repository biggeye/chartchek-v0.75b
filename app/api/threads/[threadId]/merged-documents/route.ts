// app/api/threads/[threadId]/merged-documents/route.ts
import { NextResponse } from 'next/server';
import { openai as awaitOpenai } from '@/utils/openai';
import { createServer } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const threadId = pathname.split('/').slice(-2, -1)[0];

  const supabase = await createServer();
  const openai = await awaitOpenai();

  try {
    // Retrieve the thread object from OpenAI using the threadId.
    const thread = await openai.beta.threads.retrieve(threadId);
    // Extract the vector store id from the thread's tool_resources.
    const vectorStoreId = thread.tool_resources?.file_search?.vector_store_ids?.[0];

    if (!vectorStoreId) {
      return NextResponse.json({
        data: [],
        has_more: false,
        first_id: null,
        last_id: null,
      });
    }

    // Get pagination parameters from the URL.
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const after = searchParams.get('after');
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;

    // Retrieve the list of files from the OpenAI vector store.
    const vectorStoreFiles = await openai.beta.vectorStores.files.list(vectorStoreId, {
      limit: limit ? parseInt(limit) : undefined,
      after: after || undefined,
      order: order,
    });
console.log ('[VectorStoreFiles]', vectorStoreFiles);
    // Query Supabase documents table using the OpenAI file IDs.
    // Here we join on documents.openai_file_id (which should contain the OpenAI file id)
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .in(
        'openai_file_id', 
        vectorStoreFiles.data.map((f) => f.id)
      );

    if (error) throw error;
console.log('[Documents]', documents);
    // Merge the OpenAI file data with Supabase document metadata.
    const mergedData = vectorStoreFiles.data.map((file) => {
      // Find the corresponding document by matching openai_file_id.
      const document = documents.find((doc: any) => doc.openai_file_id === file.id);
      return {
        ...file,
        metadata: document?.metadata || null,
        supabase_data: document
          ? {
              filename: document.file_name,
              upload_date: document.created_at,
            }
          : undefined,
      };
    });
   console.log ('[MergedData]', mergedData);
    // Prepare pagination info.
    const pagination = {
      has_more: vectorStoreFiles.hasNextPage(),
      first_id: vectorStoreFiles.data[0]?.id,
      last_id: vectorStoreFiles.data[vectorStoreFiles.data.length - 1]?.id,
    };

    return NextResponse.json({
      data: mergedData,
      ...pagination,
    });
  } catch (error) {
    console.error('[MergeDocumentsError]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
