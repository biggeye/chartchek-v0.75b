import OpenAI from "openai";
import { createServer } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const supabase = await createServer();
    const user = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
  });

    const formData = await req.formData();
    try {
        const assistantId = formData.get("assistant_id") as string;
        const vectorStoreId = formData.get("vector_store_id") as string;
    
        if (!assistantId || !vectorStoreId) {
            return new Response(JSON.stringify({
                success: false,
                error: "Missing required fields: assistant_id or vector_store_id"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const assistantUpdate = await openai.beta.assistants.update(assistantId, {
            tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
        });
    
        return new Response(JSON.stringify({
            success: true,
            body: assistantUpdate,
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    
    } catch (error) {
        console.error("Failed to update assistant:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Failed to update assistant with vector store id"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}