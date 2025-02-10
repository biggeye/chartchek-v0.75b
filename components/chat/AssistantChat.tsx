'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { MessageList } from './MessageList'
import { FileUpload } from '../file-upload'
import { EnhancedSubmitButton } from './EnhancedSubmitButton'
import { useAssistantStore } from '@/store/assistantStore'
import { useDocumentStore } from '@/store/documentStore'
import { FormMessage } from '@/components/form-message'
import { Message, MessageContent, TextContent, MessageRole } from '@/types/api/openai'
import { UserAssistant } from '@/types/database'
import { useStreaming } from '@/lib/useStreaming';
import GetFileIcon from '@/components/get-file-icon';

interface AssistantChatProps {
  currentAssistant: UserAssistant
  initialVectorStoreId?: string
}

export function AssistantChat({
  currentAssistant,
  initialVectorStoreId
}: AssistantChatProps) {
  const {
    fetchThreadMessages,
    createThread,
    error: storeError,
    setError,
    messages: storeMessages,
    setMessages: setStoreMessages,
    addMessage
  } = useAssistantStore()
  const {
    getFileQueue,
    fileQueue,
    clearFileQueue,
    isLoading: documentLoading,
    documents
  } = useDocumentStore()
  const [message, setMessage] = useState('')
  const [threadId, setThreadId] = useState('')
  const [assistantId, setAssistantId] = useState(currentAssistant?.assistant_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setLocalError] = useState<string | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initializingRef = useRef(false)
  const submittingRef = useRef(false)

  const uploadDocument = useDocumentStore((state) => state.uploadDocument)

  useEffect(() => {
    if (currentAssistant?.assistant_id) {
      setAssistantId(currentAssistant.assistant_id)
    }
  }, [currentAssistant])

  // Create initial thread if needed
  useEffect(() => {
    const initThread = async () => {
      // Only create thread if we don't have one and have an assistant
      if (!threadId && assistantId && !isLoading && !initializingRef.current) {
        initializingRef.current = true
        console.log('[AssistantChat] Initializing thread for assistant:', assistantId)
        setIsLoading(true)
        try {
          const newThreadId = await createThread(assistantId)
          if (newThreadId) {
            console.log('[AssistantChat] Created initial thread:', newThreadId)
            setThreadId(newThreadId)
          } else {
            console.error('[AssistantChat] Failed to create initial thread')
            setLocalError('Failed to create initial thread')
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    initThread()
  }, [assistantId])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  const { streamingContent, handleStream, setStreamingContent } = useStreaming();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading || !message.trim()) return;

    setIsLoading(true);
    setLocalError(undefined);

    try {
      const formData = new FormData();
      formData.append('content', message);
      formData.append('thread_id', threadId);
      formData.append('role', 'user');
      formData.append('file_queue', JSON.stringify(getFileQueue()));
      const sentMessage = await fetch('/api/thread/message', {
        method: 'POST',
        body: formData,
      });
      const result = await sentMessage.json();
      addMessage(result.message);
      try {
        await handleStream();
      } catch (error) {
        console.error('[handleStream] Error starting stream:', error);
        const errorMessage = error instanceof Error ? error.message : 'Please try again.';
        setLocalError(errorMessage);
      } finally {
        fetchThreadMessages();
        setIsLoading(false);
      }
      setMessage('');
    } catch (error) {
      console.error('[AssistantChat] Message send failed:', error);
      setLocalError('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !submittingRef.current) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  const addMessageIfNotEmpty = (msg: Message) => {
    if (msg.content.some(content => content.text.value.trim() !== '')) {
      addMessage(msg);
    }
  };

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
    <div className="flex flex-col h-full w-full">
       <MessageList
        messages={storeMessages}
        streamingContent={streamingContent}
      />

      {fileQueue.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 bottom-0 p-2 rounded-md mb-2 flex items-center">
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
      <form onSubmit={handleSubmit} className="space-y-4 bottom-4">
        <div className="flex gap-2 items-center">
          {threadId && (
            <FileUpload
              isAttachment={true}
              threadId={threadId}
              onFileUpload={async (file) => {

                setIsLoading(true);
                setLocalError(undefined);

                try {
                  console.log('[AssistantChat] File uploading:', file.name);
                  const fileId = await uploadDocument(file);

                  if (!fileId) {
                    throw new Error('Upload failed: No file ID returned');
                  }

                  console.log('[AssistantChat] File uploaded with ID:', fileId);
                } catch (error) {
                  console.error('[AssistantChat] File upload failed:', error);
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
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="h-[50px] max-h-[200px] flex-1 !resize-none overflow-hidden focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            resizable={false}
          />
          <EnhancedSubmitButton
            message={message}
            isLoading={isLoading}
            isStreaming={isLoading}
            error={error || undefined}
            assistantId={assistantId}
            threadId={threadId}
          />
        </div>
      </form>

      {/* Loading Indicator */}
      {documentLoading && (
        <div className="flex justify-center items-center">
          <span className="loader"></span> Processing files...
        </div>
      )}

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