import { openai as awaitOpenai } from '@/utils/openai';
import { createServer } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServer();
  const openai = await awaitOpenai();
  const { fileId } = await req.json();

  try {
    const vectorStore = await openai.beta.vectorStores.create({
      file_ids: [fileId],
    });

    const vectorLogged = await supabase
      .from('documents')
      .upsert({
        vector_store_id: vectorStore.id,
      })
      .eq('file_id', fileId)
      .single();

    console.log('[FileCreateVectorStore] Vector store logged in supabase:', vectorLogged)

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