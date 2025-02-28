'use client'

import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import DocumentsTable from '@/components/datatable-card';
import { useRouter } from 'next/navigation';

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments, uploadAndProcessDocument } = useDocumentStore();
  const router = useRouter();

  const handleFileSelect = async (file: File) => {
    if (file) {
      try {
        const result = await uploadAndProcessDocument(file);
        if (result) {
          console.log('Document uploaded and processed:', result);
          
          // If it failed to process with OpenAI but was stored successfully
          if (result.processingStatus === 'failed' || result.processingStatus === 'unsupported_format') {
            console.warn('Document was saved but could not be processed by OpenAI:', 
              result.processingStatus, result.processingError);
          }
        }
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };


  const handleEditDocument = (documentId: string) => {
    router.push(`/protected/documents/${documentId}`);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const latestDocs = await fetchDocuments();
        console.log('Fetched documents:', latestDocs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    
    loadData();
  }, [fetchDocuments]);

  if (isLoading && documents.length === 0) return <div>Loading documents...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Documents</h1>
       </div>
      <DocumentsTable 
        documents={documents} 
        onEditDocument={handleEditDocument}
        onFileSelect={handleFileSelect}
        isLoading={isLoading}
      />
    </div>
  );
}
