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
  const params = useParams();
  const { documents, fetchDocuments } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
    // Removed unused store methods
  }, []);

  const document = documents.find(doc => doc.document_id === params.id);

  if (!document) return <div>Document not found</div>;

  const { document_id, fileName, fileType, metadata } = document;
  const category = metadata?.[0]?.category;
  const notes = metadata?.[0]?.notes;
  const tags = metadata?.[0]?.tags;

  const breadcrumbPages = [
    { name: 'Documents', href: '/protected/documents', current: false },
    { name: fileName, href: `#`, current: true },
  ];

  const handleCreateVector = async () => {
    // Removed unused store methods
  };



  return (
    <div>
      <div className="px-4 sm:px-0">
        <h3 className="text-base/7 font-semibold text-gray-900">{fileName}</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Details and metadata of the document.</p>
      </div>
      <div className="mt-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Category</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">{category || 'No category'}</dd>
          </div>
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">File Type</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">{fileType}</dd>
          </div>
          <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900">Description</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:mt-2">
              {notes || 'No description available.'}
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
              Document <span className="text-gray-700">#{document_id}</span>
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">{fileName}</div>
            <div className="mt-1 text-sm text-gray-600">Type: {fileType}</div>
           
          </h1>
        </div>
        <div className="flex items-center gap-x-4 sm:gap-x-6">
         
         
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

            </MenuItems>
          </Menu>
        </div>
      </div>
    </div>
  );
}