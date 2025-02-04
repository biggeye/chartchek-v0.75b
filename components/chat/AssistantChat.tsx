'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageList } from './MessageList'
import { ThreadList } from './ThreadList'
import { FileUpload } from './FileUpload'
import { RunStatus } from './RunStatus'
import { SubmitButton } from './SubmitButton'
import { NewThreadButton } from './NewThreadButton'

import { Message, MessageContent, MessageStatus } from '@/types/types'

interface AssistantChatProps {
  initialAssistantId?: string
  initialThreadId?: string
  initialVectorStoreId?: string
}

export function AssistantChat({ initialAssistantId, initialThreadId, initialVectorStoreId }: AssistantChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [assistantId, setAssistantId] = useState<string>(initialAssistantId || '')
  const [threadId, setThreadId] = useState<string>(initialThreadId || '')
  const [streamingContent, setStreamingContent] = useState<MessageContent[]>([])
  const [error, setError] = useState<string>('')
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    console.log('[AssistantChat] Initialized with:', { initialAssistantId, initialThreadId })
    if (!threadId) {
      createThreadIfNeeded().then(newThreadId => {
        console.log('[AssistantChat] Created initial thread:', newThreadId)
      })
      if (initialVectorStoreId) {
        const formData = new FormData();
        formData.append('vector_store_id', initialVectorStoreId);
        formData.append('assistant_id', assistantId);

        fetch('/api/assistant/update', {
          method: 'POST',
          body: formData,
        }).then(response => {
          if (!response.ok) {
            throw new Error('Failed to update assistant')
          }
          return response.json()
        }).then(data => {
          console.log('[AssistantChat] Updated assistant:', data)
        }).catch(error => {
          console.error('[AssistantChat] Failed to update assistant:', error)
          setError('Failed to update assistant with vector store')
        })
      }
    }
  }, [initialAssistantId, initialThreadId, initialVectorStoreId, assistantId])

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Helper: Create an assistant if not already set.
  const createAssistantIfNeeded = async (): Promise<string> => {
    if (!assistantId) {
      console.log('[AssistantChat] Creating new assistant...')
      const assistantRes = await fetch('/api/assistant/create', {
        method: 'POST',
        body: new FormData(),
      })
      if (!assistantRes.ok) {
        const errText = await assistantRes.text()
        console.error('[AssistantChat] Failed to create assistant:', errText)
        throw new Error('Failed to create assistant')
      }
      const assistantData = await assistantRes.json()
      const newAssistantId = assistantData.assistant.id
      console.log('[AssistantChat] Created assistant:', newAssistantId)
      setAssistantId(newAssistantId)
      return newAssistantId
    }
    return assistantId
  }

  // Helper: Create a thread if not already set.
  // IMPORTANT: Use threadData.thread_id instead of threadData.id.
  const createThreadIfNeeded = async (): Promise<string> => {
    if (!threadId) {
      console.log('[AssistantChat] Creating new thread...')
      const threadRes = await fetch('/api/thread/create', {
        method: 'POST',
        body: new FormData(),
      })
      if (!threadRes.ok) {
        const errText = await threadRes.text()
        console.error('[AssistantChat] Failed to create thread:', errText)
        throw new Error('Failed to create thread')
      }
      const threadData = await threadRes.json()
      console.log('[AssistantChat] Thread created:', threadData)
      const newThreadId = threadData.thread_id
      console.log('[AssistantChat] Created thread:', newThreadId)
      setThreadId(newThreadId)
      return newThreadId
    }
    return threadId
  }

  // Internal submission function (not event-dependent) to allow reuse for enter key.
  const submitMessage = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading) return

    setIsLoading(true)
    setError('')

    // Optimistically add user message.
    const userMessage: Message = {
      role: 'user',
      content: [{
        type: 'text',
        text: trimmedMessage
      }],
      file_ids: [],
      created_at: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    setMessage('')

    try {
      // Ensure that assistant & thread are available.
      const currentAssistantId = await createAssistantIfNeeded()
      const currentThreadId = await createThreadIfNeeded()

      // Send message request.
      console.log('[AssistantChat] Sending message to thread:', currentThreadId)
      const messageRes = await fetch('/api/thread/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: currentThreadId,
          message: trimmedMessage,
        }),
      })
      if (!messageRes.ok) {
        const errText = await messageRes.text()
        console.error('[AssistantChat] Failed to send message:', errText)
        throw new Error('Failed to send message')
      }
      const messageData = await messageRes.json()
      console.log('[AssistantChat] Message sent:', {
        messageId: messageData.message_id,
        threadId: messageData.thread_id
      })

      // Update optimistic user message with server returned ID.
      setMessages(prev => prev.map((msg, idx) =>
        idx === prev.length - 1 ? { ...msg, id: messageData.message_id } : msg
      ))

      // Start stream processing.
      await startStream(currentAssistantId, currentThreadId)
    } catch (err) {
      console.error('[AssistantChat] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Roll back optimistic update.
      setMessages(prev => prev.slice(0, -1))
      setMessage(trimmedMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Local streaming assistant message object.
  let currentAssistantMessage: {
    id: string
    role: 'assistant'
    content: string
    status: MessageStatus
    file_ids: string[]
    created_at: number
    timestamp: number
  } = {
    id: '',
    role: 'assistant',
    content: '',
    status: 'streaming',
    file_ids: [],
    created_at: Date.now(),
    timestamp: Date.now()
  }

  const startStream = async (assistId: string, thread: string) => {
    console.log('[AssistantChat] Starting stream...')
    setIsLoading(true)
    /*
    here we need logic to check if the assistant and thread already exists,
    if yes, we just need to move to the try block, but if not we need to create them
    first using the api endpoints
    */


    try {
      const response = await fetch('/api/thread/run/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: thread,
          assistant_id: assistId,
          stream: true
        }),
      })
      if (!response.ok) {
        const errText = await response.text()
        console.error('[AssistantChat] Stream failed:', errText)
        throw new Error('Stream failed')
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available for stream')

      setStreamingContent([])

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[AssistantChat] Stream complete')
          break
        }

        const chunk = new TextDecoder().decode(value)
        console.log('[AssistantChat] Received chunk:', chunk)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        console.log('[AssistantChat] Parsed lines:', lines)

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            console.log('[AssistantChat] Parsed event:', event)

            if (event.type === 'textCreated') {
              console.log('[AssistantChat] Text created event')
              currentAssistantMessage.content = ''
              setStreamingContent([{
                type: 'text',
                text: ''
              }])
            }
            else if (event.type === 'textDelta') {
              console.log('[AssistantChat] Adding delta:', event.data.delta)
              if (event.data.delta?.value) {
                currentAssistantMessage.content += event.data.delta.value
                setStreamingContent([{
                  type: 'text',
                  text: currentAssistantMessage.content
                }])
              }
            }
            else if (event.type === 'end') {
              console.log('[AssistantChat] Stream ended')
              setIsLoading(false)
              
              // Add final message if not already added
              if (currentAssistantMessage.content) {
                // First update the UI
                setMessages(prev => {
                  const messageExists = prev.some(msg => 
                    msg.id === currentAssistantMessage.id || 
                    (msg.role === 'assistant' && msg.content[0]?.text === currentAssistantMessage.content)
                  );
                  if (!messageExists) {
                    return [...prev, {
                      id: currentAssistantMessage.id || `temp-${Date.now()}`,
                      role: 'assistant',
                      content: [{
                        type: 'text',
                        text: currentAssistantMessage.content
                      }],
                      status: 'completed',
                      file_ids: [],
                      created_at: Date.now()
                    }];
                  }
                  return prev;
                });

                // Store in the database using existing message endpoint
                try {
                  const response = await fetch('/api/thread/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      thread_id: thread,
                      message: currentAssistantMessage.content,
                      role: 'assistant'  // Add role to distinguish it from user messages
                    }),
                  });

                  if (!response.ok) {
                    console.error('[AssistantChat] Failed to store assistant message:', await response.text());
                  } else {
                    const data = await response.json();
                    console.log('[AssistantChat] Stored assistant message:', data);
                    
                    // Update the message ID with the one from the database
                    if (data.message_id) {
                      setMessages(prev => prev.map(msg => 
                        msg.id === `temp-${currentAssistantMessage.timestamp}` ? { ...msg, id: data.message_id } : msg
                      ));
                    }
                  }
                } catch (error) {
                  console.error('[AssistantChat] Error storing assistant message:', error);
                }
              }
              setStreamingContent([])
              break
            }
            else if (event.type === 'thread.message.created') {
              currentAssistantMessage.id = event.data.id
              currentAssistantMessage.timestamp = event.data.created_at || Date.now()
            }
            else if (event.type === 'thread.message.in_progress') {
              currentAssistantMessage.status = 'in_progress'
            }
            else if (event.type === 'thread.message.completed') {
              console.log('[AssistantChat] Message completed')
              const assistantMessage: Message = {
                id: currentAssistantMessage.id || event.data.id,
                role: 'assistant',
                content: [{
                  type: 'text',
                  text: currentAssistantMessage.content
                }],
                status: 'completed',
                file_ids: [],
                created_at: currentAssistantMessage.timestamp
              }
              
              setMessages(prev => {
                const messageExists = prev.some(msg => 
                  msg.id === assistantMessage.id || 
                  (msg.role === 'assistant' && msg.content[0]?.text === assistantMessage.content[0].text)
                );
                return messageExists ? prev : [...prev, assistantMessage];
              })
              
              setStreamingContent([])
              setIsLoading(false)
              
              // Reset the current message
              currentAssistantMessage = {
                id: '',
                role: 'assistant',
                content: '',
                status: 'streaming',
                file_ids: [],
                created_at: Date.now(),
                timestamp: Date.now()
              }
            }
            else {
              console.log('[AssistantChat] Unhandled event type:', event.type)
            }
          } catch (e) {
            console.error('[AssistantChat] Error parsing stream data:', e)
            setError('Error parsing stream data')
          }
        }
      }
    } catch (e) {
      console.error('[AssistantChat] Error:', e)
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Form submit handler.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitMessage()
  }

  // Textarea onKeyDown handler.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submitMessage()
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
    <div className="flex flex-col h-full w-full gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">

        <h2 className="text-lg font-semibold">Chat</h2>
        <NewThreadButton onNewThread={async (assistantId: string) => {
          console.log('[AssistantChat] Creating new thread...')
          try {
            const response = await fetch('/api/thread/create', {
              method: 'POST',
              body: new FormData(),
            })
            if (!response.ok) {
              const errText = await response.text()
              console.error('[AssistantChat] Failed to create thread:', errText)
              throw new Error('Failed to create thread')
            }
            const data = await response.json()
            console.log('[AssistantChat] New thread created:', data.thread_id)
            setThreadId(data.thread_id)
            setStreamingContent([])
            setMessages([])
            setError('')
          } catch (error) {
            console.error('[AssistantChat] Error creating thread:', error)
            setError('Failed to create new thread')
          }
        }} />
      </div>

      {/* Messages */}
      <MessageList messages={messages} streamingContent={streamingContent} />

      {/* Status */}
      <RunStatus
        isStreaming={isLoading || isFileUploading}
        error={error}
        assistantId={assistantId}
        threadId={threadId}
        className="sticky top-0 z-10"
      />

      {/* File Upload Success Alert */}
      {fileUploadSuccess && (
        <div style={floatingAlertStyle}>
          <Alert className="bg-green-50 border-green-200 shadow-lg">
            <AlertDescription className="text-green-800">
              Successfully uploaded file: {fileUploadSuccess}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* File Upload Error Alert */}
      {fileUploadError && (
        <div style={floatingAlertStyle}>
          <Alert className="bg-red-50 border-red-200 shadow-lg">
            <AlertDescription className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {fileUploadError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* File Upload */}
      {threadId ? (
        <FileUpload 
          threadId={threadId} 
          onFileUpload={async (file, uploadPromise) => {
            setIsFileUploading(true);
            setFileUploadSuccess(null);
            setFileUploadError(null);
            
            try {
              console.log('[AssistantChat] File uploading:', file.name);
              // Wait for the upload to complete
              const response = await uploadPromise;
              
              // Check if the response is ok
              if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                  errorData?.error || 
                  `Upload failed: ${response.status} ${response.statusText}`
                );
              }
              
              console.log('[AssistantChat] File uploaded:', file.name);
              setFileUploadSuccess(file.name);
              
              // Clear success message after 5 seconds
              setTimeout(() => {
                setFileUploadSuccess(null);
              }, 5000);
            } catch (error) {
              console.error('[AssistantChat] File upload failed:', error);
              const errorMessage = error instanceof Error ? 
                error.message : 
                'Failed to upload file. Please try again.';
              
              setFileUploadError(errorMessage);
              
              // Clear error message after 5 seconds
              setTimeout(() => {
                setFileUploadError(null);
              }, 5000);
            } finally {
              setIsFileUploading(false);
            }
          }} 
        />
      ) : null}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] flex-1 resize-none"
            disabled={isLoading}
          />
          <SubmitButton
            message={message}
            isLoading={isLoading}
          />
        </div>
      </form>
    </div>
  )
}