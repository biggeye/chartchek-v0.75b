'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { PaperClipIcon } from '@heroicons/react/20/solid';
import { useDocumentStore } from '@/store/documentStore';
import { useClientStore } from '@/store/clientStore';
import { Document } from '@/types/store/document';

interface DocumentListProps {
  documents: Document[];
  fileQueue: Document[];
  addToFileQueue: (doc: Document) => void;
  removeFromFileQueue: (doc: Document) => void;
}

export default function ChatInputArea({
  onMessageSubmit,
  isSubmitting
}: {
  onMessageSubmit: (content: string, attachments: string[]) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [currentMessage, setCurrentMessage] = useState('');
  const { fileQueue, uploadFileToOpenAI } = useDocumentStore();
  const { currentThreadId } = useClientStore((state) => state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isSubmitting) return;

    try {
      const attachments = await Promise.all(
        fileQueue.map(file => uploadFileToOpenAI(file))
      );

      await onMessageSubmit(currentMessage.trim(), attachments.filter(Boolean) as string[]);
      // Clear state after successful submission
      setCurrentMessage('');
    } catch (error) {
      console.error('[ChatInput] Submit error:', error);
    }
  };

  const { documents, isLoading: isDocumentsLoading, fetchDocuments, addToFileQueue, removeFromFileQueue } = useDocumentStore();
  const [page, setPage] = useState(0);
  const itemsPerPage = 4;

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

  const paginatedDocuments = useMemo(() => {
    return documents.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  }, [documents, page, itemsPerPage]);

  const DocumentList = ({ documents, fileQueue, addToFileQueue, removeFromFileQueue }: {
    documents: Document[];
    fileQueue: Document[];
    addToFileQueue: (doc: Document) => void;
    removeFromFileQueue: (doc: Document) => void;
  }) => {
    return (
      <ListboxOptions
        transition
        className="absolute left-0 bottom-full z-[100] mb-2 w-64 origin-bottom-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[60vh] overflow-y-auto data-[closed]:opacity-0 data-[closed]:scale-95 data-[open]:opacity-100 data-[open]:scale-100"
      >
        {isDocumentsLoading ? (
          <div className="relative cursor-default select-none py-2 px-3 text-gray-500">
            Loading documents...
          </div>
        ) : (
          paginatedDocuments.map((doc: Document) => (
            <ListboxOption
              key={doc.document_id}
              value={doc}
              className={({ active }) => `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-indigo-50' : 'text-gray-900'}`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={fileQueue.some((f: Document) => f.document_id === doc.document_id)}
                  onChange={() => fileQueue.some((f: Document) => f.document_id === doc.document_id)
                    ? removeFromFileQueue(doc)
                    : addToFileQueue(doc)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  aria-label={`Select ${doc.fileName}`}
                />
                <span className="ml-3 block truncate font-medium">
                  {doc.fileName}
                  {doc.processingStatus === 'processing' && (
                    <span className="ml-2 text-indigo-500 text-xs">(processing)</span>
                  )}
                </span>
              </div>
            </ListboxOption>
          ))
        )}
        {documents.length > itemsPerPage && (
          <div className="flex justify-between mt-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="xxs px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => (prev + 1) * itemsPerPage < documents.length ? prev + 1 : prev)}
              disabled={(page + 1) * itemsPerPage >= documents.length}
              className="xxs px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </ListboxOptions>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative z-10">
      <div className="bottom-0 px-2 flex rounded-lg bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">

        <input

          placeholder="Ask a question..."
          className="block w-full resize-none px-3 py-2 text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none z-20"
          value={currentMessage || ''}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          style={{ height: 'auto' }}

        />
        {/* Spacer to match the toolbar height */}




        <Listbox as="div" className="shrink-0 relative">
          <ListboxButton
            disabled={isDocumentsLoading}
            className="inline-flex items-center rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3 disabled:opacity-50"
          >
            {/* Always show the icon */}
            <PaperClipIcon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-gray-300"
            />
            <span className="hidden truncate sm:ml-2 sm:block">
              {isDocumentsLoading
                ? 'Loading documents...'
                : fileQueue.length
                  ? `${fileQueue.length} selected`
                  : ''}
            </span>
          </ListboxButton>
          <DocumentList
            documents={documents}
            fileQueue={fileQueue}
            addToFileQueue={addToFileQueue}
            removeFromFileQueue={removeFromFileQueue}
          />
        </Listbox>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isSubmitting ? 'Loading...' : 'Send'}
        </button>


      </div>
    </form>

  );
}
