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
        
        // First try 'file', then fall back to 'files' for backward compatibility
        let file = formData.get('file') as File;
        if (!file) {
            file = formData.get('files') as File;
        }

        if (!file) {
            console.error('[FileUpload] No file provided in form data. Available fields:', Array.from(formData.keys()));
            return new Response("No file provided", { status: 400 });
        }
        
        console.log('[FileUpload] Processing file:', {
            name: file.name,
            type: file.type,
            size: file.size
        });
       
        try {
            // Validate file is not empty
            if (file.size === 0) {
                console.error('[FileUpload] File is empty');
                return new Response("File is empty", { status: 400 });
            }
            
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
            return new Response("Failed to upload file to OpenAI: " + (uploadError instanceof Error ? uploadError.message : String(uploadError)), { status: 500 });
        }
    } catch (error) {
        console.error('[FileUpload] Error:', error);
        return new Response("Internal Server Error: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
    }
}