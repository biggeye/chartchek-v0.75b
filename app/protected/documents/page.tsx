'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { Document, DocumentCategorization } from '@/types/store/document'
import { Button } from '@/components/ui/button'
import DocumentUploadDialog from '@/components/documents/DocumentUploadDialog'
import DocumentsTable from '@/components/documents/DocumentTable'
import { PlusIcon } from '@heroicons/react/20/solid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DocumentsPage() {
  const { documents, isLoading, error, fetchDocuments, uploadAndProcessDocument } = useDocumentStore()
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleFileUpload = async (file: File, categorization: DocumentCategorization) => {
    console.log('[DocumentsPage:handleFileUpload] Starting file upload process', {
      file_name: file.name,
      fileSize: file.size,
      fileType: file.type,
      categorization
    })
    
    setUploadError(null)
    
    if (file) {
      try {
        console.log('[DocumentsPage:handleFileUpload] Calling uploadAndProcessDocument')
        const result = await uploadAndProcessDocument(file, categorization)
        
        if (result) {
          console.log('[DocumentsPage:handleFileUpload] Upload successful:', result)
          setIsUploadDialogOpen(false)
        } else {
          console.error('[DocumentsPage:handleFileUpload] Upload failed: No result returned')
          setUploadError('Upload failed. Please try again.')
        }
      } catch (error) {
        console.error('[DocumentsPage:handleFileUpload] File upload failed:', error)
        setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
      }
    } else {
      console.error('[DocumentsPage:handleFileUpload] No file provided')
      setUploadError('No file selected. Please select a file to upload.')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Document Library</h1>
        
      <ScrollArea className="h-full w-full overflow-y-auto overflow-x-auto pb-20 mb-20">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Documents</h2>
        <Button 
          onClick={() => setIsUploadDialogOpen(true)}
          className="rounded-full p-2 h-9 w-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white"
          disabled={isLoading}
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>
    
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DocumentsTable 
            documents={documents} 
            isLoading={isLoading}
            detailsUrlPrefix="/protected/documents"
          />
        </TabsContent>
      </Tabs>
      </ScrollArea>      
      <DocumentUploadDialog 
        isOpen={isUploadDialogOpen} 
        onClose={() => setIsUploadDialogOpen(false)} 
        onUpload={handleFileUpload}
        isLoading={isLoading}
        error={uploadError}
      />
    </div>
  )
}
