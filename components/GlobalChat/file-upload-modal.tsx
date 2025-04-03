"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useGlobalChatStore } from "@/store/chat/globalChatStore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function FileUploadModal({ onClose }: { onClose: () => void }) {
  const { 
    uploadFiles, 
    isUploading, 
    addFilesToUpload, 
    processUploadFiles: startUpload, 
    removeUploadFile,
    
   } = useGlobalChatStore()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFilesToUpload(acceptedFiles)
    },
    [addFilesToUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-1">
          {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select files"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports images, PDFs, Word documents, text files, and spreadsheets
        </p>
      </div>

      {uploadFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Files ({uploadFiles.length})</h3>
            <Button
              size="sm"
              onClick={() => startUpload()}
              disabled={isUploading || !uploadFiles.some((f) => f.status === "pending")}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload All"
              )}
            </Button>
          </div>

          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-4 space-y-3">
              {uploadFiles.map((file) => (
                <div key={file.id} className="flex items-start gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {file.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {(file.status === "pending" || file.status === "uploading") && (
                        <div className="h-4 w-4 flex items-center justify-center">
                          {file.status === "uploading" && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <span className="font-medium truncate">{file.file.name}</span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">{formatFileSize(file.file.size)}</div>

                    {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-2" />}

                    {file.status === "error" && <div className="text-xs text-red-500 mt-1">{file.error}</div>}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted"
                    onClick={() => removeUploadFile(file.id)}
                    disabled={file.status === "uploading"}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={onClose}>
              Add to Queue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

