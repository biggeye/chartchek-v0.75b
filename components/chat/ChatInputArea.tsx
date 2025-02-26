'use client'

import { useState, useEffect, useMemo } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { PaperClipIcon } from '@heroicons/react/20/solid'
import { useDocumentStore } from '@/store/documentStore'
import { useChatStore } from '@/store/chatStore'
import { Document } from '@/types/store/document'

export default function ChatInputArea({
  onMessageSubmit,
  isSubmitting
}: {
  onMessageSubmit: (content: string, attachments: string[]) => Promise<void>
  isSubmitting: boolean
}) {
  const [currentMessage, setCurrentMessage] = useState('')

  // Use chatStore for file queue management and file uploads.
  const { 
    transientFileQueue, 
    addFileToQueue, 
    removeFileFromQueue, 
    currentThread
  } = useChatStore()

  // Use documentStore for fetching the global list of documents.
  const { uploadFileToOpenAI, documents, isLoading: isDocumentsLoading, fetchDocuments } = useDocumentStore()

  const itemsPerPage = 4
  const [page, setPage] = useState(0)

  // Determine if the current thread is active (i.e. has a valid vector store id)
  const isThreadActive =
    currentThread &&
    currentThread.tool_resources?.file_search?.vector_store_ids &&
    currentThread.tool_resources.file_search.vector_store_ids[0] !== 'temp-vector-store'

  // Fetch documents on mount.
  useEffect(() => {
    (async () => {
      try {
        await fetchDocuments()
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    })()
  }, [fetchDocuments])

  const paginatedDocuments = useMemo(() => {
    return documents.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  }, [documents, page, itemsPerPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMessage.trim() || isSubmitting) return

    try {
      // For each file in the file queue, use its openai_file_id if available,
      // otherwise upload it via chatStore.uploadFile.
      const attachments = await Promise.all(
        transientFileQueue.map(async (file: Document) => {
          if (file.openai_file_id) return file.openai_file_id
          return await uploadFileToOpenAI(file)
        })
      )
      const validAttachments = attachments.filter(Boolean) as string[]
      await onMessageSubmit(currentMessage.trim(), validAttachments)
      setCurrentMessage('')
    } catch (error) {
      console.error('[ChatInputArea] Submit error:', error)
    }
  }

  // Toggle a document's attachment state in the file queue.
  const handleCheckboxChange = (doc: Document) => {
    if (!doc.openai_file_id) {
      console.warn(`Document ${doc.fileName} has no OpenAI file id yet.`)
      return
    }
    if (transientFileQueue.some((f: Document) => f.document_id === doc.document_id)) {
      removeFileFromQueue(doc)
    } else {
      addFileToQueue(doc)
    }
  }

  // Compute attached file IDs from the current thread if active.
  const attachedFileIds =
    isThreadActive && currentThread?.current_files
      ? currentThread.current_files.map((file: Document) => file.openai_file_id)
      : []

  // Render document list as a dropdown.
  const DocumentList = () => (
    <ListboxOptions className="absolute bottom-full right-0 mb-1 max-w-[40vw] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-y-hidden">
      {isDocumentsLoading ? (
        <div className="relative cursor-default select-none py-2 px-3 text-gray-500">
          Loading documents...
        </div>
      ) : (
        paginatedDocuments.map((doc: Document) => {
          const isChecked = isThreadActive
            ? Boolean(doc.openai_file_id && attachedFileIds.includes(doc.openai_file_id))
            : transientFileQueue.some((f: Document) => f.document_id === doc.document_id)
          return (
            <ListboxOption
              key={doc.document_id}
              value={doc}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-3 pr-9 ${
                  active ? 'bg-indigo-50' : 'text-gray-900'
                }`
              }
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(doc)}
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
          )
        })
      )}
      {documents.length > itemsPerPage && (
        <div className="flex justify-between mt-2 px-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setPage((prev) => (prev + 1) * itemsPerPage < documents.length ? prev + 1 : prev)
            }
            disabled={(page + 1) * itemsPerPage >= documents.length}
            className="xxs px-3 py-1 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </ListboxOptions>
  )

  return (
    <form onSubmit={handleSubmit} className="relative z-10">
      <div className="bottom-0 px-2 flex rounded-lg bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
        <input
          placeholder="Ask a question..."
          className="block w-full resize-none px-3 py-2 text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none z-20"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onInput={(e) => {
            const target = e.target as HTMLInputElement
            target.style.height = 'auto'
            target.style.height = `${target.scrollHeight}px`
          }}
          style={{ height: 'auto' }}
          disabled={isSubmitting}
        />
        <Listbox as="div" className="relative">
          <ListboxButton
            disabled={isDocumentsLoading || isSubmitting}
            className="inline-flex items-center rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3 disabled:opacity-50"
          >
            <PaperClipIcon className="h-5 w-5 mr-1" />
            <span className="hidden truncate sm:ml-2 sm:block">
              {isDocumentsLoading
                ? 'Loading documents...'
                : isThreadActive
                ? `${attachedFileIds.length} selected`
                : transientFileQueue.length
                ? `${transientFileQueue.length} selected`
                : ''}
            </span>
          </ListboxButton>
          <DocumentList />
        </Listbox>
        <button
          type="submit"
          disabled={isSubmitting || !currentMessage.trim()}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Loading...' : 'Send'}
        </button>
      </div>
    </form>
  )
}
