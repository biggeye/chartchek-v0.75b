'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Document } from '@/types/store/document'
import Image from 'next/image'

interface DynamicPaginatedDocumentListProps {
  documents: Document[]
  isLoading: boolean
  onDocumentSelect: (document: Document) => void
  selectedDocumentIds: string[]
  className?: string
  itemHeight?: number
  minItemsPerPage?: number
  containerPadding?: number
}

/**
 * A reusable component for displaying a paginated list of documents
 * with dynamic pagination based on container size
 */
export function DynamicPaginatedDocumentList({
  documents,
  isLoading,
  onDocumentSelect,
  selectedDocumentIds,
  className,
  itemHeight = 40, // Default height of each item in pixels
  minItemsPerPage = 2, // Minimum number of items per page
  containerPadding = 60, // Padding for pagination controls and container padding
}: DynamicPaginatedDocumentListProps) {
  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(minItemsPerPage)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset page when documents change
  useEffect(() => {
    setPage(0)
  }, [documents.length])

  // Dynamic pagination based on container size
  useEffect(() => {
    if (!containerRef.current) return

    // Function to calculate items per page based on container height
    const calculateItemsPerPage = () => {
      const container = containerRef.current
      if (!container) return

      // Get the container height
      const containerHeight = container.clientHeight

      // Calculate how many items can fit in the container with padding
      const availableHeight = containerHeight - containerPadding

      // Calculate optimal number of items, with a minimum
      const optimal = Math.max(minItemsPerPage, Math.floor(availableHeight / itemHeight))

      // Update items per page if it's different
      if (optimal !== itemsPerPage) {
        setItemsPerPage(optimal)
        // Reset to first page when container size changes
        setPage(0)
      }
    }

    // Calculate initially
    calculateItemsPerPage()

    // Set up ResizeObserver to recalculate when container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateItemsPerPage()
    })

    resizeObserver.observe(containerRef.current)

    // Clean up observer on unmount
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [itemsPerPage, itemHeight, minItemsPerPage, containerPadding])

  // Paginated documents
  const paginatedDocuments = useMemo(() => {
    return documents.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  }, [documents, page, itemsPerPage])

  return (
    <div ref={containerRef} className={cn("overflow-y-auto h-full", className)}>
      {isLoading ? (
        <div className="py-2 px-3 text-gray-500">Loading documents...</div>
      ) : paginatedDocuments.length === 0 ? (
        <div className="py-2 px-3 text-gray-500">No documents found</div>
      ) : (
        <>
          {/* Document list */}
          {paginatedDocuments.map((doc) => {
            const isSelected = selectedDocumentIds.includes(doc.document_id)
            return (
              <div
                key={doc.document_id}
                className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`doc-${doc.document_id}`}
                    checked={isSelected}
                    onChange={() => onDocumentSelect(doc)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label
                    htmlFor={`doc-${doc.document_id}`}
                    className="ml-2 block text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {doc.file_name}
                    {doc.processing_status === 'processing' && (
                      <span className="ml-2 text-blue-500 text-xs">(processing)</span>
                    )}
                  </label>
                </div>
              </div>
            )
          })}

          {/* Pagination controls */}
          {documents.length > itemsPerPage && (
            <div className="flex justify-between mt-2 px-3">
              <button
                onClick={() => setPage(Math.max(page - 1, 0))}
                disabled={page === 0}
                className="px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(page + 1, Math.ceil(documents.length / itemsPerPage) - 1))}
                disabled={page >= Math.ceil(documents.length / itemsPerPage) - 1}
                className="px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
