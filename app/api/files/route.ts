import { openai as awaitOpenai } from "@/utils/openai";
import { createServer } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    const openai = await awaitOpenai();

    try {
        const contentType = req.headers.get('Content-Type') || '';
        if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
            console.log('[FileUpload] Error: Invalid Content-Type:', contentType);
            return new Response("Invalid Content-Type. Expected 'multipart/form-data' or 'application/x-www-form-urlencoded'.", { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response("No file provided", { status: 400 });
        }
       
        try {
            const fileUpload = await openai.files.create({
                file: file,
                purpose: "assistants",
            });
            console.log('[FileUpload] Uploaded file ID:', fileUpload.id);
            
            return new Response(JSON.stringify({
                file_id: fileUpload.id
            }), { status: 200 });
        } catch (uploadError) {
            console.error('[FileUpload] Error uploading file to OpenAI:', uploadError);
            return new Response("Failed to upload file to OpenAI", { status: 500 });
        }
    } catch (error) {
        console.error('[FileUpload] Error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}