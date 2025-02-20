'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { MessageList } from './MessageList'
import { FileUpload } from '../file-upload'
import { EnhancedSubmitButton } from './EnhancedSubmitButton'
import { useClientStore } from '@/store/clientStore'
import { useDocumentStore } from '@/store/documentStore'
import { FormMessage } from '@/components/form-message'
import { useStreaming } from '@/lib/useStreaming';
import GetFileIcon from '@/components/get-file-icon';

interface AssistantChatProps {
  assistantId: string
}

export function Chat({ assistantId }: AssistantChatProps) {

  const {
    currentAssistantId,
    createThread,
    setCurrentMessage,
    currentConversation,
    fetchThreadMessages,
    setCurrentThreadId,
    setCurrentAssistantId,
    sendMessage,
    error: storeError,
    setError
  } = useClientStore();

  const { streamingContent, handleStream, setStreamingContent } = useStreaming();

  const [message, setMessage] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setLocalError] = useState<string | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initializingRef = useRef(false)
  const submittingRef = useRef(false)

  const {
    getFileQueue,
    fileQueue,
    clearFileQueue,
    isLoading: documentLoading,
    documents,
    addToFileQueue
  } = useDocumentStore()
  const uploadDocument = useDocumentStore((state) => state.uploadDocument)
  // Get currentThreadId from the store
  const currentThreadId = useClientStore((state) => state.currentThreadId);
  // Create initial thread if needed
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  useEffect(() => {
  }, [currentThreadId, assistantId]);

  useEffect(() => {
    setCurrentAssistantId(assistantId);
    adjustTextareaHeight();
  }, [assistantId, setCurrentAssistantId, adjustTextareaHeight]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading || !message.trim()) return;

    if (!currentThreadId) {
      const newThread: string | null = await createThread(assistantId);

      if (!newThread) {
        setError('Failed to create thread');
        return;
      }
      setCurrentThreadId(newThread);
    }

    setIsLoading(true);
    setLocalError(undefined);

    try {
      const formData = new FormData();
      const threadId = currentThreadId.toString();
      setCurrentMessage(message);
      formData.append('assistant_id', assistantId);
      formData.append('content', message);
      formData.append('thread_id', threadId);
      formData.append('role', 'user');
      formData.append('file_queue', JSON.stringify(getFileQueue()));
      
      const sentMessage = await sendMessage(threadId, formData);
      const result = await sentMessage.json();

      if (!result) {
        setError('Message not sent.');
        return;
      }

      try {
        await handleStream();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Please try again.';
        setLocalError(errorMessage);
      } finally {
        fetchThreadMessages(currentThreadId);
        setIsLoading(false);
      }
      setMessage('');
    } catch (error) {
      setLocalError('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !submittingRef.current) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  const floatingAlertStyle = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 50,
    maxWidth: '24rem',
    animation: 'slideIn 0.2s ease-out',
  } as const;

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []); // Empty dependency array since this only needs to run once

 

  return (
    <div className="flex flex-col justify-between h-full w-full py-5">
      <MessageList
        messages={currentConversation || []}
        streamingContent={streamingContent}
      />
{/*}
      {fileQueue.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 h-3 bottom-0 p-2 rounded-md mb-1 flex items-center">
          {fileQueue.map((fileId, index) => {
            const document = documents.find(doc => doc.file_id === fileId);
            const fileType = document?.file_type || '';
            const UploadIcon = GetFileIcon(fileType);
            return (
              <div key={index} className="flex items-center">
                <UploadIcon />
                <span className="ml-2">{fileId}</span>
              </div>
            );
          })}
        </div>
      )}
*/}
      <form onSubmit={handleSubmit} className="sticky bottom-0.25 px-3 pt-5">
        <div className="flex gap-2 p-0.5 items-center">
      {/*     {currentThreadId && (
           <FileUpload
              isAttachment={true}
              threadId={currentThreadId}
              onFileUpload={async (file: File) => {

                setIsLoading(true);
                setLocalError(undefined);

                try {
                  const fileId = await uploadDocument(file);

                  if (!fileId) {
                    throw new Error('Upload failed: No file ID returned');
                  }

                  addToFileQueue(fileId, currentThreadId);
                } catch (error) {
                  const errorMessage = error instanceof Error ?
                    error.message :
                    'Failed to upload file. Please try again.';

                  setLocalError(errorMessage);
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}
        */}  <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="h-[40px] max-h-[200px] flex-1 !resize-none overflow-hidden focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            resizable={false}
          />
          <div ref={bottomRef} className="flex items-center justify-between transition-opacity">
            <EnhancedSubmitButton
              message={message}
              isLoading={isLoading}
              isStreaming={isLoading}
              error={error || undefined}
              assistantId={assistantId}
              threadId={currentThreadId}
              onSubmit={handleSubmit} // Assuming handleSubmit is the function to handle the submit action
              className="transition-transform submit-button-class" // Replace with the desired class name
            />
          </div>
        </div>
      </form>

      {/* File Upload Status Messages */}
      {(error) && (
        <div style={floatingAlertStyle}>
          <FormMessage
            message={
              error
                ? { error }
                : { message: '' }
            }
          />
        </div>
      )}
    </div>
  )
}