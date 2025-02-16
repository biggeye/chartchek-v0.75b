'use client'

import { PaperClipIcon } from '@heroicons/react/20/solid';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDocumentStore } from '@/store/documentStore';
import Breadcrumb from '@/components/ui/breadcrumb';
import { Document, ProcessingStatus } from '@/types/database';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

export default function DocumentDetail() {
  const { id } = useParams();
  const { documents, fetchDocuments, isLoading, error, createVectorStore, setVectorStoreId } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const document = documents.find((doc) => doc.id === id);

  if (!document) return <div>Document not found</div>;

  const fileId = document.file_id;
  const vectorStoreId = document.vector_store_id;

  console.log('vectorStoreId: ', vectorStoreId, 'fileId: ', fileId);
  const breadcrumbPages = [
    { name: 'Documents', href: '/protected/documents', current: false },
    { name: document.filename, href: `#`, current: true },
  ];

  const handleCreateVector = async () => {
    const vectorStoreId = await createVectorStore(fileId);
  };

  const createThreadWithVectorStore = async () => {
    if (!vectorStoreId) {
      await createVectorStore(fileId);
      console.error('Missing vectorStoreId or fileId');
      return;
    }
  };

  return (
    <div>
      <div className="px-4 sm:px-0">
        <h3 className="text-base/7 font-semibold text-gray-900">{document.filename}</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Details and metadata of the document.</p>
      </div>
      <div className="mt-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Category</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">{document.category || 'No category'}</dd>
          </div>
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">File Type</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">{document.file_type}</dd>
          </div>
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Description</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
              {document.description || 'No description available.'}
            </dd>
          </div>
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Attachments</dt>
            <dd className="mt-2 text-sm text-gray-900">
              <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                
              </ul>
            </dd>
          </div>
        </dl>
      </div>
      <div className="mx-auto flex items-center justify-between gap-x-8 lg:mx-0">
        <div className="flex items-center gap-x-6">
          <img
            alt=""
            src="https://tailwindui.com/plus-assets/img/logos/48x48/tuple.svg"
            className="size-16 flex-none rounded-full ring-1 ring-gray-900/10"
          />
          <h1>
            <div className="text-sm/6 text-gray-500">
              Document <span className="text-gray-700">#{document.id}</span>
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">{document.filename}</div>
            <div className="mt-1 text-sm text-gray-600">Type: {document.file_type}</div>
            {document.vector_store_id && <div className="badge">In Vector Store</div>}
          </h1>
        </div>
        <div className="flex items-center gap-x-4 sm:gap-x-6">
          <button
            type="button"
            onClick={handleCreateVector}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${document.vector_store_id ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600' : 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'}`}
            disabled={!!document.vector_store_id}
          >
            {document.vector_store_id ? 'Vector' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => createThreadWithVectorStore()}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            disabled={!document.vector_store_id}
          >
            Send
          </button>
          <Menu as="div" className="relative sm:hidden">
            <MenuButton className="-m-3 block p-3">
              <span className="sr-only">More</span>
              <EllipsisVerticalIcon aria-hidden="true" className="size-5 text-gray-500" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <MenuItem>
                <button
                  type="button"
                  className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                >
                  Copy URL
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                >
                  Edit
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  onClick={() => createThreadWithVectorStore()}
                  className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                >
                  Create Thread
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </div>
  );
}