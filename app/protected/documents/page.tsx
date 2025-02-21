'use client'

import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments } = useDocumentStore();

  const handleUpload = async (file: File) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No authenticated user');

      const filePath = `${user.id}/${file.name}`;

      // Upload to storage bucket
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // Insert document record
      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        bucket: 'documents',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      await fetchDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
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

  if (isLoading) return <div>Loading documents...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">Documents</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the documents in your account including their name, type, and additional metadata.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Input
            id="document-upload"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
          />
          <Button
            asChild
            variant="default"
            className="gap-1"
            disabled={isLoading}
          >
            <label htmlFor="document-upload" className="cursor-pointer">
              <ArrowUpTrayIcon className="h-4 w-4" />
              Upload Document
            </label>
          </Button>
        </div>
      </div>
      <ScrollArea className="-mx-4 mt-8 sm:-mx-0">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                Filename
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
              >
                File Type
              </th>
              <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-0">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {documents.map((document) => (
              <tr key={document.document_id}>
                <td className="w-full max-w-0 py-4 pr-3 pl-4 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-0">
                  <a href={`${document.filePath}`} className="hover:underline">
                    {document.fileName}
                  </a>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{document.fileType}</td>
                <td className="py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-0">
                  <a href={`/protected/documents/${document.document_id}`} className="text-indigo-600 hover:text-indigo-900">
                    Edit<span className="sr-only">, {document.fileName}</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
