'use client'

import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { useEffect } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import Breadcrumb from '@/components/ui/breadcrumb';

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const breadcrumbPages = [
    { name: 'Documents', href: '/protected/documents', current: true },
  ];

  return (
    <div>
      <Breadcrumb pages={breadcrumbPages} />
      <ul role="list" className="divide-y divide-gray-100">
        {documents.map((document) => (
          <li
            key={document.id}
            className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 lg:px-8"
          >
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-sm/6 font-semibold text-gray-900">
                  <a href={`/protected/documents/${document.id}`}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {document.filename}
                  </a>
                </p>
                <p className="mt-1 flex text-xs/5 text-gray-500">
                  {document.file_type}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-4">
              {document.vector_store_id && (
                <div className="badge">Vector Store</div>
              )}
              <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
