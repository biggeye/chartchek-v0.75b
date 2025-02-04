import { createServer } from "@/utils/supabase/server";
import { OpenAI } from "openai";

export async function POST(req: Request) {
    const supabase = await createServer();
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({
            success: false,
            error: "Unauthorized"
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { thread_id, message, role = "user" } = await req.json();
        console.log('[API] Received message request:', { thread_id, messageLength: message?.length, role });
        
        if (!thread_id || !message) {
            return new Response(JSON.stringify({
                success: false,
                error: "Missing required parameters"
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Add message to OpenAI thread
        const threadMessage = await openai.beta.threads.messages.create(thread_id, {
            role: role as "user" | "assistant",
            content: message,
        });

        console.log('[API] Message created:', { messageId: threadMessage.id, threadId: thread_id, role });

        if (!threadMessage?.id) {
            throw new Error("Failed to create message with OpenAI");
        }

        // Insert into Supabase
        const { error: dbError } = await supabase
            .from("chat_messages")
            .insert([
                {
                    user_id: user.id,
                    thread_id: thread_id,
                    message_id: threadMessage.id,
                    role: role,
                    content: message
                }
            ]);

        if (dbError) {
            console.error('[API] Database error:', dbError);
            throw dbError;
        }

        return new Response(JSON.stringify({
            success: true,
            message_id: threadMessage.id,
            thread_id: thread_id
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Error adding message to thread:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
