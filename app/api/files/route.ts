import { openai as awaitOpenai } from "@/utils/openai";
import { createServer } from "@/utils/supabase/server";
import { checkAuth } from "@/utils/auth/checkAuth";

export async function POST(req: Request) {
    const supabase = await createServer()
    const authResult = await checkAuth();
    if (authResult instanceof Response) {
      return authResult;
    }
    const userId = authResult as string;
    const openai = await awaitOpenai();

    try {

        const contentType = req.headers.get('Content-Type') || '';
        if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
            console.log('[FileUpload] Error: Invalid Content-Type:', contentType);
            return new Response("Invalid Content-Type. Expected 'multipart/form-data' or 'application/x-www-form-urlencoded'.", { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const threadId = formData.get('thread_id') as string;

        if (files.length === 0) {
            return new Response("No files provided", { status: 400 });
        }
       
        const fileIds: string[] = [];
        for (const file of files) {
            const fileUpload = await openai.files.create({
                file: file,
                purpose: "assistants",
            });
            fileIds.push(fileUpload.id);
            console.log('[FileUpload] Uploaded file ID:', fileUpload.id);
        }

        // Handle single file upload
        if (fileIds.length === 1) {
            const singleFileVectorStore = await openai.beta.vectorStores.create({
                name: `${userId}-${threadId}-single-file`,
                file_ids: [fileIds[0]],
            });

            const updatedThread = await openai.beta.threads.update(threadId, {
                tool_resources: {
                    file_search: {
                        vector_store_ids: [singleFileVectorStore.id]
                    }
                }
            });

            return new Response(JSON.stringify({
                file_id: fileIds[0],
                vector_store_id: singleFileVectorStore.id,
                thread_id: updatedThread.id
            }), { status: 200 });
        }

        // Create a file batch
        const timestamp = new Date().toISOString();
        const myVectorStoreFileBatch = await openai.beta.vectorStores.fileBatches.create(
            `${userId}-${threadId}-${timestamp}`,
            {
                file_ids: fileIds
            }
        );
        console.log(myVectorStoreFileBatch);

        const updatedThreadBatch = await openai.beta.threads.update(threadId, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [myVectorStoreFileBatch.id]
                }
            }
        });

        return new Response(JSON.stringify({
            file_ids: fileIds,
            vector_store_batch_id: myVectorStoreFileBatch.id,
            thread_id: updatedThreadBatch.id
        }), { status: 200 });

    } catch (error) {
        console.error('[FileUpload] Error:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}