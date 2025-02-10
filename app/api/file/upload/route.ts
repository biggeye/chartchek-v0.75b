import OpenAI from "openai";
import { createServer } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        console.log('[FileUpload] Starting file upload process')
        const supabase = await createServer();
        const user = await supabase.auth.getUser();
        if (!user) {
            console.log('[FileUpload] Unauthorized: No user found')
            return new Response("Unauthorized", { status: 401 })
        }
        console.log('[FileUpload] User authenticated:', user.data.user?.id)

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const threadId = formData.get('thread_id') as string;

        if (!file) {
            console.log('[FileUpload] Error: No file provided in form data')
            return new Response("No file provided", { status: 400 });
        }
        console.log('[FileUpload] File received:', { name: file.name, size: file.size, type: file.type })

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Upload file to OpenAI
        console.log('[FileUpload] Uploading file to OpenAI...')
        const fileUpload = await openai.files.create({
            file: file,
            purpose: "assistants",
        });


        const { data, error } = await supabase
            .from('documents')
            .insert([{
                user_id: user.data.user?.id,
                filename: file.name,
                file_id: fileUpload.id,
            }]);

        if (error) {
            console.error('[FileUpload] Supabase insert error:', error)
            throw error;
        }

        return new Response(JSON.stringify({
            file_id: fileUpload.id,
            filename: file.name
        }), {
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
    console.error('[FileUpload] Unhandled error:', error);
    return new Response("Error uploading file", { status: 500 });
}}