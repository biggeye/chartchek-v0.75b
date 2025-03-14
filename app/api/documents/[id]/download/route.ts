import { NextRequest } from 'next/server';
import { getOpenAIClient } from '@/utils/openai/server';
import { createServer } from '@/utils/supabase/server';

/**
 * API route to download a document from OpenAI
 * GET /api/documents/[id]/download
 */
export async function GET(request: NextRequest) {
  try {
    // Extract document ID from URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    const documentId = segments[segments.length - 2]; // The ID is the second-to-last segment

    // Get the document from Supabase to retrieve the OpenAI file ID
    const supabase = await createServer();
    const { data: document, error } = await supabase
      .from('documents')
      .select('openai_file_id, file_name, file_type')
      .eq('document_id', documentId)
      .single();

    if (error || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if OpenAI file ID exists
    if (!document.openai_file_id) {
      return new Response(
        JSON.stringify({ error: 'Document has no associated OpenAI file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the OpenAI client
    const openai = getOpenAIClient();
    
    // Retrieve file content from OpenAI
    const fileContent = await openai.files.content(document.openai_file_id);
    
    // Convert the response to a blob
    const blob = await fileContent.blob();
    
    // Determine content type based on file type
    let contentType = 'application/octet-stream'; // Default
    if (document.file_type) {
      switch (document.file_type.toLowerCase()) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
        case 'csv':
          contentType = 'text/csv';
          break;
        // Add more types as needed
      }
    }

    // Create response with appropriate headers for download
    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to download document' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
