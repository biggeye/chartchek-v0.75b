import { createServer } from "@/utils/supabase/server";
import { OpenAI } from "openai";
import { Thread } from "@/types/types";

export async function POST(req: Request) {
    try {
        const supabase = await createServer();
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: "Unauthorized"
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await req.formData();
        const initialMessage = formData.get("message") as string | null;
        const assistantId = formData.get("assistant_id") as string;
        console.log("AssistantID: ", assistantId, " InitialMessage: ", initialMessage)
              // Create thread with OpenAI
        const thread = await openai.beta.threads.create(initialMessage ? {
            messages: [{
                role: "user",
                content: initialMessage
            }]
        } : undefined);

        console.log('[API] Created thread:', thread.id);

        // Store thread info in Supabase
        const { data: newThread, error: dbError } = await supabase
            .from('chat_threads')
            .insert({
                user_id: user.id,
                thread_id: thread.id,
                assistant_id: assistantId || null
            })
            .select()
            .single();

        if (dbError) {
            console.error('[API] Database error:', dbError);
            throw new Error('Failed to store thread in database');
        }

        return new Response(JSON.stringify({
            success: true,
            thread: thread,
            db_record: newThread
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[API] Error creating thread:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}