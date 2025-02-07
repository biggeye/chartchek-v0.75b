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
        console.log('[FileUpload] OpenAI file upload successful:', { file_id: fileUpload.id })

        if (fileUpload) {
            try {
                // Create a vector store for the uploaded file
                console.log('[FileUpload] Creating vector store...')
                const vectorStore = await openai.beta.vectorStores.create({
                    name: `${file.name}_store`,
                });
                console.log('[FileUpload] Vector store created:', { store_id: vectorStore.id })

                // Upload the file to the vector store
                console.log('[FileUpload] Adding file to vector store...')
                const newVectorStoreFile = await openai.beta.vectorStores.files.create(
                    vectorStore.id,
                    { file_id: fileUpload.id }
                );
                console.log('[FileUpload] File added to vector store:', {
                    vector_store_id: newVectorStoreFile.vector_store_id,
                    file_id: fileUpload.id
                })
    
 
                       // Store file info in Supabase
                console.log('[FileUpload] Storing file info in Supabase...')
                const { data, error } = await supabase
                    .from('documents')
                    .insert([{
                        user_id: user.data.user?.id,
                        filename: file.name,
                        file_id: fileUpload.id,
                        vector_store_id: newVectorStoreFile.vector_store_id
                    }]);

                if (error) {
                    console.error('[FileUpload] Supabase insert error:', error)
                    throw error;
                }
                console.log('[FileUpload] File info stored in Supabase successfully')

                return new Response(JSON.stringify({
                    file_id: fileUpload.id,
                    vector_store_id: newVectorStoreFile.vector_store_id,
                    filename: file.name
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            } catch (vectorError) {
                console.error('[FileUpload] Vector store error:', vectorError);
                console.log('[FileUpload] Returning partial success with file upload info')
                // Still return the file upload info even if vector store fails
                return new Response(JSON.stringify({
                    file_id: fileUpload.id,
                    filename: file.name,
                    error: 'Vector store creation failed'
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            }
        }

        console.error('[FileUpload] File upload failed: No response from OpenAI')
        return new Response("File upload failed", { status: 500 });
    } catch (error) {
        console.error('[FileUpload] Unhandled error:', error);
        return new Response("Error uploading file", { status: 500 });
    }
}