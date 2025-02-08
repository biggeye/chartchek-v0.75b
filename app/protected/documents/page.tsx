'use client'

import { ChevronRightIcon } from '@heroicons/react/20/solid';

const documents = [
  {
    name: 'Document 1',
    description: 'This is document 1',
    href: '/protected/documents/1',
    lastSeen: '3h ago',
    lastSeenDateTime: '2023-01-23T13:23Z',
  },
  {
    name: 'Document 2',
    description: 'This is document 2',
    href: '/protected/documents/2',
    lastSeen: '3h ago',
    lastSeenDateTime: '2023-01-23T13:23Z',
  },
  {
    name: 'Document 3',
    description: 'This is document 3',
    href: '/protected/documents/3',
    lastSeen: null,
    lastSeenDateTime: null,
  },
  {
    name: 'Document 4',
    description: 'This is document 4',
    href: '/protected/documents/4',
    lastSeen: '3h ago',
    lastSeenDateTime: '2023-01-23T13:23Z',
  },
  {
    name: 'Document 5',
    description: 'This is document 5',
    href: '/protected/documents/5',
    lastSeen: '3h ago',
    lastSeenDateTime: '2023-01-23T13:23Z',
  },
  {
    name: 'Document 6',
    description: 'This is document 6',
    href: '/protected/documents/6',
    lastSeen: null,
  },
]

export default function DocumentsPage() {
  return (
    <div>
      <h1>Documents</h1>
      <ul role="list" className="divide-y divide-gray-100">
        {documents.map((document) => (
          <li
            key={document.name}
            className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 lg:px-8"
          >
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-sm/6 font-semibold text-gray-900">
                  <a href={document.href}>
                    <span className="absolute inset-x-0 -top-px bottom-0" />
                    {document.name}
                  </a>
                </p>
                <p className="mt-1 flex text-xs/5 text-gray-500">
                  {document.description}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-x-4">
              <div className="hidden sm:flex sm:flex-col sm:items-end">
                {document.lastSeen ? (
                  <p className="mt-1 text-xs/5 text-gray-500">
                    Last seen <time dateTime={document.lastSeenDateTime}>{document.lastSeen}</time>
                  </p>
                ) : (
                  <div className="mt-1 flex items-center gap-x-1.5">
                    <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs/5 text-gray-500">Online</p>
                  </div>
                )}
              </div>
              <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
            </div>
          </li>
        ))}
      </ul>
         </div>
  )
}
