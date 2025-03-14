import { getOpenAIClient } from '@/utils/openai/server'
import { createServer } from "@/utils/supabase/server";

const openai = getOpenAIClient()

export async function POST(req: Request) {
    console.log('[FileUpload] POST request received');
    const supabase = await createServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (authError || !userId) {
        console.error('[FileUpload] Authentication error:', authError);
        return new Response("Authentication required", { status: 401 });
    }
    
    console.log('[FileUpload] Authenticated user:', userId);

    try {
        const contentType = req.headers.get('Content-Type') || '';
        console.log('[FileUpload] Content-Type:', contentType);
        
        if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
            console.log('[FileUpload] Error: Invalid Content-Type:', contentType);
            return new Response("Invalid Content-Type. Expected 'multipart/form-data' or 'application/x-www-form-urlencoded'.", { status: 400 });
        }

        const formData = await req.formData();
        console.log('[FileUpload] Form data received, fields:', Array.from(formData.keys()));
        
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
            
            console.log('[FileUpload] Uploading file to OpenAI...');
            const fileUpload = await openai.files.create({
                file: file,
                purpose: "assistants",
            });
            console.log('[FileUpload] Uploaded file ID:', fileUpload.id);
            
            return new Response(JSON.stringify({
                file_id: fileUpload.id
            }), { 
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (uploadError) {
            console.error('[FileUpload] Error uploading file to OpenAI:', uploadError);
            return new Response("Failed to upload file to OpenAI: " + (uploadError instanceof Error ? uploadError.message : String(uploadError)), { status: 500 });
        }
    } catch (error) {
        console.error('[FileUpload] Error:', error);
        return new Response("Internal Server Error: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
    }
}