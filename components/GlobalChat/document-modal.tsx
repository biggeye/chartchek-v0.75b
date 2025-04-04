// components/GlobalChat/document-modal.tsx
"use client"

import { useEffect } from "react"
import { useGlobalChatStore } from "@/store/chat/globalChatStore"
import { Document, ComplianceConcernType } from "@/types/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CheckCircle2, FileText, FileIcon as FilePdf, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import useDocumentStore from "@/store/doc/documentStore"
import { useFacilityStore } from "@/store/patient/facilityStore"

export default function DocumentModal({ onClose }: { onClose: () => void }) {
  const {
    documents,
    isLoadingDocuments,
    fetchDocuments,
    fetchDocumentsForCurrentFacility
  } = useDocumentStore()

  const { currentFacilityId } = useFacilityStore();

  const {
    queueItems,
    selectQueueItem,
    deselectQueueItem
  } = useGlobalChatStore();

  // Get selected documents from queue items
  const selectedDocuments = queueItems.filter(item => item.type === 'document');

  useEffect(() => {
    fetchDocumentsForCurrentFacility()
  }, [fetchDocumentsForCurrentFacility])

  const handleCategoryChange = (category: string | "all") => {
    if (category === "all") {
      fetchDocumentsForCurrentFacility()
    } else {
      // If you want to filter by category, you'll need to implement this
      fetchDocumentsForCurrentFacility()
    }
  }

  const formatFileSize = (sizeStr: string | null | undefined): string => {
    if (!sizeStr) return "Unknown size";
    
    const bytes = parseInt(sizeStr);
    if (isNaN(bytes)) return sizeStr;
    
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // Type guard to check if compliance_concern matches a specific value
  const hasComplianceConcern = (doc: Document, concern: ComplianceConcernType): boolean => {
    return doc.compliance_concern === concern;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => handleCategoryChange(value as any)}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DocumentList
            documents={documents as Document[]}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectQueueItem}
            onDeselect={deselectQueueItem}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
        <TabsContent value="medical">
          <DocumentList
            documents={(documents as Document[]).filter(d => hasComplianceConcern(d, 'medical'))}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectQueueItem}
            onDeselect={deselectQueueItem}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
        <TabsContent value="financial">
          <DocumentList
            documents={(documents as Document[]).filter(d => hasComplianceConcern(d, 'financial'))}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectQueueItem}
            onDeselect={deselectQueueItem}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
        <TabsContent value="legal">
          <DocumentList
            documents={(documents as Document[]).filter(d => hasComplianceConcern(d, 'legal'))}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectQueueItem}
            onDeselect={deselectQueueItem}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
        <TabsContent value="other">
          <DocumentList
            documents={(documents as Document[]).filter(d => hasComplianceConcern(d, 'other') || !d.compliance_concern)}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectQueueItem}
            onDeselect={deselectQueueItem}
            formatFileSize={formatFileSize}
          />
        </TabsContent>
      </Tabs>

      {selectedDocuments.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? "s" : ""} selected
          </div>
          <Button size="sm" onClick={onClose}>
            Add to Queue
          </Button>
        </div>
      )}
    </div>
  )
}

function DocumentList({
  documents,
  selectedDocuments,
  isLoading,
  onSelect,
  onDeselect,
  formatFileSize,
}: {
  documents: Document[]
  selectedDocuments: any[] // Using any for queue items
  isLoading: boolean
  onSelect: (document: any) => void
  onDeselect: (documentId: string) => void
  formatFileSize: (bytes: string | null | undefined) => string
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No documents found</div>
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-4 space-y-2">
        {documents.map((document) => (
          <DocumentItem
            key={document.document_id}
            document={document}
            isSelected={selectedDocuments.some((d) => d.id === document.document_id)}
            onSelect={() => onSelect({
              id: document.document_id,
              name: document.file_name || 'Unnamed document',
              type: 'document'
            })}
            onDeselect={() => onDeselect(document.document_id)}
            formatFileSize={formatFileSize}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function DocumentItem({
  document,
  isSelected,
  onSelect,
  onDeselect,
  formatFileSize,
}: {
  document: Document
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  formatFileSize: (bytes: string | null | undefined) => string
}) {
  const handleClick = () => {
    if (isSelected) {
      onDeselect()
    } else {
      onSelect()
    }
  }

  const getDocumentIcon = () => {
    const fileType = document.file_type?.toLowerCase() || '';
    
    if (fileType.includes('pdf')) {
      return <FilePdf className="h-4 w-4 text-muted-foreground" />
    } else if (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => fileType.includes(ext))) {
      return <FileImage className="h-4 w-4 text-muted-foreground" />
    } else {
      return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-colors flex items-center gap-3 ${
        isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
      }`}
      onClick={handleClick}
    >
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">{getDocumentIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{document.file_name || 'Unnamed document'}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{document.file_type?.toUpperCase() || 'UNKNOWN'}</span>
          <span>•</span>
          <span>{formatFileSize(document.file_size)}</span>
          <span>•</span>
          <span>{document.compliance_concern || 'Uncategorized'}</span>
        </div>
      </div>
      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
    </div>
  )
}