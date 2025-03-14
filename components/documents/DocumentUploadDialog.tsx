'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid'
import DocumentCategorizationForm from './DocumentCategorizationForm'
import { DocumentCategorization } from '@/types/store/document'

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document and categorize it by facility, patient, and compliance concern.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        
        <DialogFooter className="sm:justify-between">
          <Button 
            onClick={onClose} 
            disabled={isLoading}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isLoading}
            className="ml-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
