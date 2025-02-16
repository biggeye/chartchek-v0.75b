'use client'

import { useRef, useCallback, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { useDocumentStore } from '@/store/documentStore';



export function FileUpload({ threadId, onFileUpload, isAttachment }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { addToFileQueue, uploadDocument } = useDocumentStore();

  const handleUpload = useCallback(async (file: File) => {
    const fileId = await uploadDocument(file);
    if (isAttachment) {
      addToFileQueue(fileId, threadId);
      return fileId;
    } else {
      return fileId;
    }
  }, [isAttachment]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsLoading(true);

    try {
      handleUpload(file);
    } catch (error) {
      console.error('[FileUpload] Error adding file to queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addToFileQueue, handleUpload]);

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
