'use client'

import { useCallback, useState } from 'react'
import { FileIcon, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFileUpload?: (file: File, uploadPromise: Promise<Response>) => Promise<void>;
  threadId: string;
}

export function FileUpload({ onFileUpload, threadId }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!onFileUpload) return;
    
    try {
      setIsLoading(true);
      for (const file of acceptedFiles) {
        // Basic file validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        const formData = new FormData();
        formData.append('file', file);
        console.log('[FileUpload] File received:', { name: file.name, size: file.size, type: file.type })
        console.log('[FileUpload] Thread ID:', threadId)
        formData.append('thread_id', threadId);

        const uploadPromise = fetch('/api/file/upload', {
          method: 'POST',
          body: formData
        });

        // Pass both the file and upload promise to parent
        await onFileUpload(file, uploadPromise);
      }
    } catch (error) {
      console.error('[FileUpload] Error:', error);
      throw error; // Re-throw to let parent handle the error
    } finally {
      setIsLoading(false);
    }
  }, [onFileUpload, threadId]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
    },
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <FileIcon className="h-8 w-8 text-muted-foreground/50" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <span>Drop the files here</span>
            ) : (
              <span>Drag & drop files here, or click to select files</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
