"use client"

import { useEffect } from "react"
import { useChatStore } from "@/store/chatStore"
import type { Document as DocumentType } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CheckCircle2, FileText, FileIcon as FilePdf, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocumentModal({ onClose }: { onClose: () => void }) {
  const {
    documents,
    selectedDocuments,
    isLoadingDocuments,
    fetchDocuments,
    fetchDocumentsByCategory,
    selectDocument,
    deselectDocument,
  } = useChatStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleCategoryChange = (category: DocumentType["category"] | "all") => {
    if (category === "all") {
      fetchDocuments()
    } else {
      fetchDocumentsByCategory(category)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="all" onValueChange={(value) => handleCategoryChange(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="administrative">Admin</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectDocument}
            onDeselect={deselectDocument}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="clinical" className="mt-4">
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectDocument}
            onDeselect={deselectDocument}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="administrative" className="mt-4">
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectDocument}
            onDeselect={deselectDocument}
            formatFileSize={formatFileSize}
          />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            isLoading={isLoadingDocuments}
            onSelect={selectDocument}
            onDeselect={deselectDocument}
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
  documents: DocumentType[]
  selectedDocuments: DocumentType[]
  isLoading: boolean
  onSelect: (document: DocumentType) => void
  onDeselect: (documentId: string) => void
  formatFileSize: (bytes: number) => string
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
            key={document.id}
            document={document}
            isSelected={selectedDocuments.some((d) => d.id === document.id)}
            onSelect={() => onSelect(document)}
            onDeselect={() => onDeselect(document.id)}
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
  document: DocumentType
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  formatFileSize: (bytes: number) => string
}) {
  const handleClick = () => {
    if (isSelected) {
      onDeselect()
    } else {
      onSelect()
    }
  }

  const getDocumentIcon = () => {
    switch (document.type) {
      case "pdf":
        return <FilePdf className="h-4 w-4 text-muted-foreground" />
      case "image":
        return <FileImage className="h-4 w-4 text-muted-foreground" />
      default:
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
        <div className="font-medium truncate">{document.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{document.type.toUpperCase()}</span>
          <span>•</span>
          <span>{formatFileSize(document.size)}</span>
          <span>•</span>
          <span>{document.category}</span>
        </div>
      </div>
      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
    </div>
  )
}

