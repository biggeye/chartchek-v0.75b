'use client'

import { PaperClipIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDocumentStore } from '@/store/documentStore';
import Breadcrumb from '@/components/ui/breadcrumb';
import { Document as DocumentType } from '@/types/store/document';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { DocumentCategorization, ComplianceConcernType } from '@/types/store/document';
import DocumentCategorizationForm from '@/components/documents/DocumentCategorizationForm';
import { Card } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

// Define processing status enum if it doesn't exist in types
enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Define Page interface for breadcrumb
interface Page {
  name: string;
  href: string;
  current: boolean;
}

export default function DocumentDetail() {
  const params = useParams();
  const { documents, fetchDocuments, updateDocumentCategorization } = useDocumentStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categorization, setCategorization] = useState<DocumentCategorization>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const document = documents.find(doc => doc.document_id === params.id);

  useEffect(() => {
    if (document) {
      // Initialize categorization from document
      setCategorization({
        facility_id: document.facility_id || undefined,
        patient_id: document.patient_id || undefined,
        compliance_concern: document.compliance_concern as ComplianceConcernType || undefined,
        compliance_concern_other: document.compliance_concern_other || undefined
      });
    }
  }, [document]);

  if (!document) return <div>Document not found</div>;

  const { document_id, file_name, file_type, metadata, openai_file_id, processing_status, processing_error, has_embeddings, file_path, bucket } = document;
  const category = metadata?.[0]?.category;
  const notes = metadata?.[0]?.notes;
  const tags = metadata?.[0]?.tags;

  const breadcrumbPages: Page[] = [
    { name: 'Documents', href: '/protected/documents', current: false },
    { name: file_name || 'Document Details', href: `#`, current: true },
  ];

  const handleCreateVector = async () => {
    // Implement vector creation logic
  };

  // Function to upload document to OpenAI
  const handleUploadToOpenAI = async () => {
    if (!document_id) {
      console.error('Document ID is missing');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create Supabase client
      const supabase = createClient();
      
      if (!document?.file_path || !document?.bucket) {
        console.error('File path or bucket is missing');
        return;
      }
      
      // Get file from Supabase storage
      const { data, error } = await supabase.storage
        .from(document.bucket)
        .download(document.file_path);
      
      if (error) {
        throw error;
      }
      
      // Create a File object from the blob
      const file = new File([data], file_name || 'document', { type: file_type || 'application/octet-stream' });
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to the OpenAI files API using FormData
      const openAIfileResponse = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      
      if (!openAIfileResponse.ok) {
        const errorText = await openAIfileResponse.text();
        throw new Error(`Failed to upload file to OpenAI: ${errorText}`);
      }
      
      const openAIfileData = await openAIfileResponse.json();
      
      // Update the document with the OpenAI file ID
      if (openAIfileData.file_id) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            openai_file_id: openAIfileData.file_id,
            processing_status: 'processed'
          })
          .eq('document_id', document_id);
          
        if (updateError) {
          console.error('Error updating document with OpenAI file ID:', updateError);
          throw updateError;
        }
        
        // Refresh the document data
        await fetchDocuments();
      }
      
      alert('File successfully uploaded to OpenAI');
    } catch (error) {
      console.error('Error uploading file to OpenAI:', error);
      alert('Error uploading file to OpenAI');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle file download
  const handleDownload = async () => {
    if (!document_id) {
      console.error('Document ID is missing');
      return;
    }

    try {
      setIsDownloading(true);
      
      // Create Supabase client
      const supabase = createClient();
      
      if (!document?.file_path || !document?.bucket) {
        console.error('File path or bucket is missing');
        return;
      }
      
      // Get file from Supabase storage
      const { data, error } = await supabase.storage
        .from(document.bucket)
        .download(document.file_path);
      
      if (error) {
        throw error;
      }
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveCategorization = async () => {
    if (!document_id) return;
    
    try {
      setIsSaving(true);
      await updateDocumentCategorization(document_id, categorization);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating document categorization:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Breadcrumb pages={breadcrumbPages} />
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Document Info */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden gray-800 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Document Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the document.</p>
              </div>
              <div className="flex items-center space-x-2">
                {!openai_file_id ? (
                  <Button
                    onClick={handleUploadToOpenAI}
                    disabled={isUploading}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2"
                  >
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    {isUploading ? 'Uploading to OpenAI...' : 'Upload to OpenAI'}
                  </Button>
                ) : (
                  null
                )}
                
                <Menu as="div" className="relative inline-block text-left">
                  <MenuButton className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="#"
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block px-4 py-2 text-sm`}
                            onClick={handleDownload}
                          >
                            Download Document
                          </a>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="#"
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block px-4 py-2 text-sm`}
                            onClick={handleCreateVector}
                          >
                            Generate Embeddings 
                          </a>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">File Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{file_name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">File Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{file_type}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Processing Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      processing_status === ProcessingStatus.COMPLETED 
                        ? 'bg-green-100 text-green-800' 
                        : processing_status === ProcessingStatus.FAILED
                        ? 'bg-red-100 text-red-800'
                        : processing_status === ProcessingStatus.PROCESSING
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {processing_status || 'Unknown'}
                    </span>
                  </dd>
                </div>
                {processing_error && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Processing Error</dt>
                    <dd className="mt-1 text-sm text-red-600 sm:col-span-2 sm:mt-0">{processing_error}</dd>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">OpenAI File ID</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0 flex justify-between items-center">
                    <div>
                      {openai_file_id ? (
                        <span className="text-green-600">{openai_file_id})</span>
                      ) : (
                        <span className="text-red-600">None</span>
                      )}
                    </div>
                  </dd>
                </div>
                {category && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{category}</dd>
                  </div>
                )}
                {notes && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{notes}</dd>
                  </div>
                )}
                {tags && tags.length > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Tags</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
        
        {/* Document Categorization */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Document Categorization</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Categorize this document.</p>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2"
                >
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setIsEditing(false)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveCategorization}
                    disabled={isSaving}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-4">
              {isEditing ? (
                <DocumentCategorizationForm
                  value={categorization}
                  onChange={setCategorization}
                  isDisabled={isSaving}
                />
              ) : (
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Facility</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {document.facility_id ? 'Assigned' : 'None'}
                    </dd>
                  </div>
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Patient</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {document.patient_id ? 'Assigned' : 'None'}
                    </dd>
                  </div>
                  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Compliance</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {document.compliance_concern ? (
                        document.compliance_concern === 'other' 
                          ? `Other: ${document.compliance_concern_other}` 
                          : document.compliance_concern.toUpperCase()
                      ) : 'None'}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </Card>
          
          {/* Embeddings Status */}
          <Card className="overflow-hidden mt-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Embeddings Status</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Vector embeddings for search.</p>
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {has_embeddings ? 'Embeddings generated' : 'No embeddings generated'}
                </span>
                {!has_embeddings && (
                  <Button
                    onClick={handleCreateVector}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2"
                  >
                    Generate Embeddings
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}