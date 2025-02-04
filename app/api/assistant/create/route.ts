import OpenAI from "openai";
import { createServer } from "@/utils/supabase/server";
import { Assistant, Tool, CodeInterpreterTool, FileSearchTool } from "@/types/types";

export async function POST(req: Request) {
    const supabase = await createServer();
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
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

    try {
        const formData = await req.formData();
        console.log('[API] Creating assistant with data:', Object.fromEntries(formData));
        const name = formData.get("name") as string;
        const instructions = formData.get("instructions") as string;
        const model = formData.get("model") as string;
        const toolsStr = formData.get("tools") as string;
        
        if (!name || !instructions || !model) {
            throw new Error("Missing required fields: name, instructions, or model");
        }

        console.log('[API] Creating assistant with config:', {
            name,
            instructions,
            model,
            tools: toolsStr
        });

        // Parse tools if provided
        let tools: Tool[] = [];
        try {
            tools = toolsStr ? JSON.parse(toolsStr) : [{ type: "file_search" } as FileSearchTool];
        } catch (e) {
            console.error('[API] Error parsing tools:', e);
            tools = [{ type: "file_search" } as FileSearchTool];
        }
        
        // Create OpenAI assistant
        const assistant = await openai.beta.assistants.create({
            name,
            instructions,
            model,
            tools,
        });
        
        console.log('[API] Assistant created:', assistant.id, assistant.name);

        // Store in Supabase
        const { data: newAssistant, error: dbError } = await supabase
            .from("user_assistants")
            .insert({
                name: assistant.name,
                assistant_id: assistant.id,
                user_id: user.id
            })
            .select()
            .single();
            
        if (dbError) {
            console.error('[API] Database error:', dbError);
            throw new Error('Failed to store assistant in database');
        }

        // Convert OpenAI assistant to our Assistant type
        const assistantResponse: Assistant = {
            id: assistant.id,
            object: 'assistant',
            name: assistant.name,
            model: assistant.model,
            description: assistant.description,
            instructions: assistant.instructions,
            tools: assistant.tools as Tool[],
            metadata: assistant.metadata
        };

        return new Response(JSON.stringify({
            success: true,
            assistant: assistantResponse,
            db_record: newAssistant
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[API] Error creating assistant:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
