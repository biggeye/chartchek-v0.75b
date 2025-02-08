'use client'

import { useRef, useCallback, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import type { FileUploadProps } from '@/types'
import { useDocumentStore } from '@/store/documentStore';

export function FileUpload({ threadId, onFileUpload }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToFileQueue } = useDocumentStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsLoading(true);

    try {
      // Add file to queue instead of uploading immediately
      addToFileQueue(file);
      console.log('[FileUpload] File added to queue:', file.name);
    } catch (error) {
      console.error('[FileUpload] Error adding file to queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addToFileQueue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-md cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        {
          'opacity-50 cursor-not-allowed': isLoading,
        }
      )}
    >
      <input {...getInputProps()} />
      <Paperclip className="h-5 w-5 text-muted-foreground/50" />
    </div>
  )
}
