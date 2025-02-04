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
        const { thread_id, message } = await req.json();
        console.log('[API] Received message request:', { thread_id, messageLength: message?.length });
        
        if (!thread_id || !message) {
            return new Response(JSON.stringify({
                success: false,
                error: "Missing required parameters"
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Add user message to OpenAI thread
        const userMessage = await openai.beta.threads.messages.create(thread_id, {
            role: "user",
            content: message,
        });

        console.log('[API] Message created:', { messageId: userMessage.id, threadId: thread_id });

        if (!userMessage?.id) {
            throw new Error("Failed to create message with OpenAI");
        }

        // Insert into Supabase
        const { error: dbError } = await supabase
            .from("chat_messages")
            .insert([
                {
                    thread_id: thread_id, // Use input thread_id (not from OpenAI)
                    message_id: userMessage.id, // Save the OpenAI message ID
                    role: "user",
                    content: message
                }
            ]);

        if (dbError) {
            console.error("Supabase Insert Error:", dbError);
            throw new Error("Failed to save message to database");
        }

        return new Response(JSON.stringify({
            success: true,
            message_id: userMessage.id,
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
