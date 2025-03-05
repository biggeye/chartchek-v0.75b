// lib/services/complianceDataProcessor.ts
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { readFile } from 'fs/promises';
import path from 'path';

interface ComplianceDocument {
  title: string;
  frameworkId: number;
  content: string;
  source?: string;
  documentType?: string;
  publishDate?: Date;
}

export async function processComplianceDocument(document: ComplianceDocument): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });
  
  try {
    // 1. Insert document record
    const { data: docRecord, error: docError } = await supabase
      .from('compliance_documents')
      .insert({
        framework_id: document.frameworkId,
        title: document.title,
        source: document.source,
        document_type: document.documentType,
        publish_date: document.publishDate,
      })
      .select()
      .single();
      
    if (docError || !docRecord) {
      throw new Error(`Failed to insert document: ${docError?.message}`);
    }
    
    // 2. Split content into sections (could be by headers, paragraphs, or fixed size)
    const sections = splitContentIntoSections(document.content);
    
    // 3. Process each section
    for (const section of sections) {
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: section.content,
      });
      
      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error('Failed to generate embedding');
      }
      
      const [responseData] = embeddingResponse.data;
      
      // Store embedding
      const { error: embedError } = await supabase
        .from('compliance_embeddings')
        .insert({
          document_id: docRecord.id,
          framework_id: document.frameworkId,
          section_title: section.title,
          content: section.content,
          token_count: embeddingResponse.usage.total_tokens,
          embedding: responseData.embedding,
        });
        
      if (embedError) {
        throw embedError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to process compliance document:', error);
    return false;
  }
}

function splitContentIntoSections(content: string) {
  // Split by headers or meaningful chunks
  // This is a simplified example - you might want more sophisticated splitting
  const sections = [];
  const lines = content.split('\n');
  
  let currentSection = { title: '', content: '' };
  
  for (const line of lines) {
    // Detect headers (starts with # for markdown)
    if (line.startsWith('#')) {
      // If we already have content, save the previous section
      if (currentSection.content.trim()) {
        sections.push({...currentSection});
      }
      
      // Start a new section
      currentSection = {
        title: line.replace(/^#+\s+/, ''),
        content: line + '\n'
      };
    } else {
      // Add to current section
      currentSection.content += line + '\n';
    }
  }
  
  // Add the last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
}

// Add a new function to process multiple compliance documents in batch
export async function processComplianceDocumentsBatch(
  documents: ComplianceDocument[]
): Promise<{success: number; failed: number}> {
  let successCount = 0;
  let failedCount = 0;
  
  for (const document of documents) {
    try {
      const success = await processComplianceDocument(document);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error('Error processing document:', document.title, error);
      failedCount++;
    }
  }
  
  return {
    success: successCount,
    failed: failedCount
  };
}

// Add a function to check if a framework has any documents
export async function hasFrameworkDocuments(frameworkId: number): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { count, error } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('framework_id', frameworkId);
      
    if (error) {
      throw error;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Failed to check framework documents:', error);
    return false;
  }
}