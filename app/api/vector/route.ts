import OpenAI from "openai";
import { createServer } from '@/utils/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const supabase = await createServer();
  
  const { fileId, name, expires_after, chunking_strategy, metadata } = await req.json();

  try {
    const vectorStore = await openai.beta.vectorStores.create({
      file_ids: fileId ? [fileId] : undefined,
      name,
      expires_after,
      chunking_strategy,
      metadata
    });

    const vectorLogged = await supabase
      .from('documents')
      .upsert({
        vector_store_id: vectorStore.id,
      })
      .eq('file_id', fileId)
      .single();

    console.log('[FileCreateVectorStore] Vector store logged in supabase:', vectorLogged);

    return new Response(JSON.stringify(vectorStore), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: Request) {
  const supabase = await createServer();
  

  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const order = searchParams.get('order') || 'desc';
    const after = searchParams.get('after');
    const before = searchParams.get('before');

    // List vector stores using OpenAI's API
    const vectorStores = await openai.beta.vectorStores.list({
    });

    return new Response(JSON.stringify(vectorStores), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[List Vector Stores] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'List operation failed',
      code: 'LIST_OPERATION_FAILED'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}