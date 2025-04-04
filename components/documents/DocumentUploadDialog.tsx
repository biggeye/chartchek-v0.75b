'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import DocumentCategorizationForm from './DocumentCategorizationForm'
import { DocumentCategorization } from '@/types/store/doc/document'
import { Transition } from '@headlessui/react'

interface DocumentUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, categorization: DocumentCategorization) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function DocumentUploadDialog({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
  error = null
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categorization, setCategorization] = useState<DocumentCategorization>({})
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[DocumentUploadDialog] File input change event triggered');
    const file = e.target.files?.[0]
    if (file) {
      console.log('[DocumentUploadDialog] File selected:', file.name, file.type, file.size);
      setSelectedFile(file)
    } else {
      console.log('[DocumentUploadDialog] No file selected from input');
    }
  }
  
  const handleUpload = async () => {
    console.log('[DocumentUploadDialog] Upload button clicked, selectedFile:', selectedFile?.name);
    if (selectedFile) {
      try {
        console.log('[DocumentUploadDialog] Calling onUpload with file and categorization:', categorization);
        await onUpload(selectedFile, categorization)
        // Reset form after successful upload
        setSelectedFile(null)
        setCategorization({})
        onClose()
      } catch (error) {
        console.error('[DocumentUploadDialog] Error in handleUpload:', error)
      }
    }
  }
  
  return (
    <Transition
      show={isOpen}
      enter="transition duration-300 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition duration-200 ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <Transition.Child
          enter="transition duration-300 ease-out"
          enterFrom="transform scale-50 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-200 ease-in"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-50 opacity-0"
        >
          <div className="relative bg-white rounded-xl shadow-xl w-[80vw] max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-grow">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-4">Click to select or drag and drop a file</p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      className="text-sm"
                    >
                      Change
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-3">Document Categorization</h3>
                    <DocumentCategorizationForm
                      value={categorization}
                      onChange={setCategorization}
                      isDisabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-between">
              <Button 
                onClick={onClose} 
                disabled={isLoading}
                variant="destructive"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  )
}
