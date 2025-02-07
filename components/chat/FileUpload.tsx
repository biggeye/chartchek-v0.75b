'use client'

import { useRef, useCallback, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import type { FileUploadProps } from '@/types'

export function FileUpload({ threadId, onFileUpload }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!onFileUpload || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('thread_id', threadId)

      const uploadPromise = fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      })

      await onFileUpload(file, uploadPromise)
    } catch (error) {
      console.error('[FileUpload] Error uploading file:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onFileUpload, threadId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        {
          'opacity-50 cursor-not-allowed': isLoading,
          'bg-accent': isDragActive,
        }
      )}
    >
      <input {...getInputProps()} />
      <Paperclip className="h-5 w-5 text-muted-foreground/50" />
    </div>
  )
}
