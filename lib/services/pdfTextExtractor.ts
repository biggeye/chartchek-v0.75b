// lib/services/pdfTextExtractor.ts
import * as pdfjsLib from 'pdfjs-dist';
import fetch from 'node-fetch';

// Define types for PDF.js
interface PDFTextContent {
  items: Array<{
    str: string;
    dir?: string;
    width?: number;
    height?: number;
    transform?: number[];
    fontName?: string;
  }>;
  styles?: Record<string, any>;
}

interface PDFMetadata {
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    [key: string]: any;
  };
  metadata?: any;
}

/**
 * Extracts text content from a PDF file using pdf.js
 * @param pdfUrl URL to the PDF file (can be a local file path or remote URL)
 * @returns Extracted text content from the PDF
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  try {
    // Set the worker source for pdf.js
    // Instead of importing the worker directly, use the CDN version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Fetch the PDF data
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    // Get the total number of pages
    const numPages = pdfDocument.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const content = await page.getTextContent() as PDFTextContent;
      
      // Extract text from text items
      const pageText = content.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts metadata from a PDF file
 * @param pdfUrl URL to the PDF file
 * @returns Object containing PDF metadata
 */
export async function extractPdfMetadata(pdfUrl: string): Promise<Record<string, any>> {
  try {
    // Set the worker source for pdf.js
    // Instead of importing the worker directly, use the CDN version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Fetch the PDF data
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    // Get metadata
    const metadata = await pdfDocument.getMetadata() as PDFMetadata;
    
    return {
      title: metadata.info?.Title || 'Untitled Document',
      author: metadata.info?.Author || 'Unknown Author',
      subject: metadata.info?.Subject || '',
      keywords: metadata.info?.Keywords || '',
      creator: metadata.info?.Creator || '',
      producer: metadata.info?.Producer || '',
      creationDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : null,
      modificationDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : null,
      pageCount: pdfDocument.numPages,
    };
  } catch (error) {
    console.error('Error extracting metadata from PDF:', error);
    throw new Error(`Failed to extract metadata from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
