// lib/services/processPdfDocument.ts
import { createClient } from '@supabase/supabase-js';
import { useOpenAI } from '../contexts/OpenAIProvider';
import { Document } from '@/types/store/document';
import { extractTextFromPdf } from './pdfTextExtractor'; // You'll need to implement this

export async function processPdfForEmbeddings(document: Document): Promise<boolean> {
  try {
    // Initialize clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const openai = getOpenAIClient()


    // 1. Get signed URL to download PDF from Supabase
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.filePath!, 300); // 5 minutes
      
    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error('Failed to generate signed URL for PDF download');
    }
    
    // 2. Extract text from PDF (you'll need a PDF text extraction library)
    const pdfText = await extractTextFromPdf(signedUrlData.signedUrl);
    
    // 3. Split text into manageable chunks (e.g., by pages or paragraphs)
    const textChunks = splitTextIntoChunks(pdfText, 1000); // Split into ~1000 character chunks
    
    console.log(`Processing ${textChunks.length} chunks from PDF document`);
    
    // 4. Generate and store embeddings for each chunk
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      
      // Generate embedding using OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
      });
      
      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error(`Failed to generate embedding for chunk ${i}`);
      }
      
      const [responseData] = embeddingResponse.data;
      
      // Store in Supabase
      const { error: insertError } = await supabase
        .from('document_embeddings')
        .insert({
          document_id: document.document_id,
          chunk_index: i,
          content: chunk,
          token_count: embeddingResponse.usage.total_tokens,
          embedding: responseData.embedding,
        });
        
      if (insertError) {
        throw insertError;
      }
    }
    
    // 5. Update document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'embedded',
        updated_at: new Date().toISOString(),
      })
      .eq('document_id', document.document_id);
      
    if (updateError) {
      throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to process PDF for embeddings:', error);
    
    // Update document with error status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabase
      .from('documents')
      .update({
        processing_status: 'embedding_failed',
        processing_error: error instanceof Error ? error.message : 'Unknown embedding error',
        updated_at: new Date().toISOString(),
      })
      .eq('document_id', document.document_id);
      
    return false;
  }
}

// Helper function to split text into chunks
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs first for more natural breaks
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds the chunk size and we already have content,
    // start a new chunk
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    currentChunk += paragraph + '\n\n';
    
    // If current chunk is still too big, force split it
    while (currentChunk.length > chunkSize) {
      // Try to split at sentence boundary if possible
      const sentenceBreakIndex = currentChunk.slice(0, chunkSize).lastIndexOf('.');
      const splitIndex = sentenceBreakIndex > chunkSize / 2 ? sentenceBreakIndex + 1 : chunkSize;
      
      chunks.push(currentChunk.slice(0, splitIndex).trim());
      currentChunk = currentChunk.slice(splitIndex);
    }
  }
  
  // Add the final chunk if there's anything left
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Add a function to associate PDF with compliance frameworks
export async function associatePdfWithComplianceFramework(
  documentId: string,
  frameworkId: number
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error } = await supabase
      .from('document_compliance_frameworks')
      .insert({
        document_id: documentId,
        framework_id: frameworkId
      });
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to associate PDF with compliance framework:', error);
    return false;
  }
}