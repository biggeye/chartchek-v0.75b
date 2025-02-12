import { openai as awaitOpenai } from "@/utils/openai";
import { createServer } from "@/utils/supabase/server";

export async function POST(req: Request) {
    const openai = await awaitOpenai();

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
        const files = formData.getAll('files') as File[];
        const threadId = formData.get('thread_id') as string;
        // here we must iterate through file.type for each File[] and store for the supabase update

        if (files.length === 0) {
            console.log('[FileUpload] Error: No files provided in form data')
            return new Response("No files provided", { status: 400 });
        }
        console.log('[FileUpload] Files received:', files.map(file => ({ name: file.name, size: file.size, type: file.type })))

        // Upload files to OpenAI and collect file IDs
        console.log('[FileUpload] Uploading files to OpenAI...')
        const fileIds: string[] = [];
        for (const file of files) {
            const fileUpload = await openai.files.create({
                file: file,
                purpose: "assistants",
            });
            fileIds.push(fileUpload.id);
        }

        // Handle single file upload
        if (fileIds.length === 1) {
            return new Response(JSON.stringify({
                file_id: fileIds[0],
                vector_store_id: "vs_single_file_id_placeholder"
            }), { status: 200 });
        }

        // Create a file batch
        const timestamp = new Date().toISOString();
        const myVectorStoreFileBatch = await openai.beta.vectorStores.fileBatches.create(
            `${user.data.user?.id}-${threadId}-${timestamp}`,
            {
                file_ids: fileIds
            }
        );
        console.log(myVectorStoreFileBatch);

        const { data, error } = await supabase
            .from('documents')
            .insert(files.map((file, index) => ({
                user_id: user.data.user?.id,
                filename: file.name,
                file_id: fileIds[index],
                file_type: file.type,
                thread_id: threadId
            })));

        if (error) {
            console.error('[FileUpload] Supabase insert error:', error)
            throw error;
        }

        return new Response(JSON.stringify({
            file_ids: fileIds,
            vector_store_batch_id: myVectorStoreFileBatch.id,
        }), { status: 200 });

    } catch (error) {
        console.error('[FileUpload] Error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}