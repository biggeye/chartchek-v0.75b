'use client'

import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments } = useDocumentStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Implement the upload logic here
      uploadDocument(file);
    }
  };

  const uploadDocument = async (file: File) => {
    try {
      // Implement the file upload logic here, e.g., using Supabase or another service
      // Example: await supabase.storage.from('documents').upload(file.name, file);

      // Refresh the document list after successful upload
      fetchDocuments();
    } catch (uploadError) {
      console.error('Error uploading document:', uploadError);
    }
  };
  if (error) return <div>Error: {error}</div>;

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
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => document.getElementById('file-upload')?.click()}
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add document
          </button>
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
              <tr key={document.id}>
                <td className="w-full max-w-0 py-4 pr-3 pl-4 text-sm font-medium text-gray-900 sm:w-auto sm:max-w-none sm:pl-0">
                  <a href={`/protected/documents/${document.id}`} className="hover:underline">
                    {document.filename}
                  </a>
                </td>
                <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{document.file_type}</td>
                <td className="py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-0">
                  <a href={`/protected/documents/${document.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Edit<span className="sr-only">, {document.filename}</span>
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
