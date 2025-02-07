'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { MessageList } from './MessageList'
import { FileUpload } from './FileUpload'
import { EnhancedSubmitButton } from './EnhancedSubmitButton'
import { useAssistantStore } from '@/store/assistantStore'
import { FormMessage } from '@/components/form-message'
import { Message, MessageContent, TextContent, MessageRole } from '@/types/api/openai'
import { UserAssistant } from '@/types/database'

interface AssistantChatProps {
  currentAssistant: UserAssistant
  initialVectorStoreId?: string
}

export function AssistantChat({
  currentAssistant,
  initialVectorStoreId
}: AssistantChatProps) {
  const {
    createThread,
    error: storeError,
    setError,
    messages: storeMessages,
    setMessages: setStoreMessages,
    addMessage
  } = useAssistantStore()
  const [message, setMessage] = useState('')
  const [threadId, setThreadId] = useState('')
  const [assistantId, setAssistantId] = useState(currentAssistant?.assistant_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setLocalError] = useState<string | undefined>(undefined)
  const [streamingContent, setStreamingContent] = useState<MessageContent[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initializingRef = useRef(false)
  const submittingRef = useRef(false)
  const streamRequestRef = useRef<AbortController | null>(null)
  const activeRunRef = useRef<string | null>(null)

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

  // Internal submission function (not event-dependent) to allow reuse for enter key.
  const submitMessage = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading || !threadId || submittingRef.current) return

    submittingRef.current = true
    setIsLoading(true)
    setLocalError(undefined)

    // Cancel any existing stream request
    if (streamRequestRef.current) {
      streamRequestRef.current.abort()
    }
    streamRequestRef.current = new AbortController()

    try {
      console.log('[AssistantChat] Sending message to thread:', threadId)
      let currentThreadId = threadId

      // Add user message to store immediately
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user' as MessageRole,
        content: [{
          type: 'text',
          text: {
            value: trimmedMessage,
            annotations: []
          }
        }],
        thread_id: currentThreadId,
        attachments: [],
        created_at: Date.now(),
        metadata: null
      }
      addMessage(userMessage)

      // Send message to API
      const formData = new FormData()
      formData.append('thread_id', currentThreadId)
      formData.append('content', trimmedMessage)
      formData.append('role', 'user')

      const messageRes = await fetch('/api/thread/message', {
        method: 'POST',
        body: formData
      })

      if (!messageRes.ok) {
        const errData = await messageRes.json().catch(() => null)
        console.error('[AssistantChat] Failed to send message:', errData)
        throw new Error(errData?.error || 'Failed to send message')
      }

      const messageData = await messageRes.json()
      console.log('[AssistantChat] Message sent:', messageData)

      // Start the run
      if (currentThreadId && assistantId) {
        console.log('[AssistantChat] Starting run with:', { currentThreadId, assistantId })

        // Check if there's an active run
        if (activeRunRef.current) {
          console.log('[AssistantChat] Waiting for active run to complete:', activeRunRef.current)
          return
        }

        const runResponse = await fetch('/api/thread/run/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            thread_id: currentThreadId,
            assistant_id: assistantId
          }),
          signal: streamRequestRef.current.signal
        })

        if (!runResponse.ok) {
          const errData = await runResponse.json().catch(() => null)
          console.error('[AssistantChat] Failed to start run:', errData)
          throw new Error(errData?.error || 'Failed to start run')
        }

        // Handle the stream response
        const reader = runResponse.body?.getReader()
        if (!reader) {
          throw new Error('No response stream available')
        }

        console.log('[AssistantChat] Processing run stream')
        let currentMessageId: string | null = null
        let currentMessageContent = ''
        let messageStarted = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              activeRunRef.current = null
              break
            }

            const text = new TextDecoder().decode(value)
            const lines = text.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6))
                console.log('[AssistantChat] Stream data:', data)

                if (data.type === 'textCreated') {
                  messageStarted = true
                  currentMessageContent = ''
                  // Create initial empty message
                  const assistantMessage: Message = {
                    id: currentMessageId || `temp-${Date.now()}`,
                    role: 'assistant' as MessageRole,
                    content: [{
                      type: 'text',
                      text: {
                        value: '',
                        annotations: []
                      }
                    }],
                    thread_id: currentThreadId,
                    attachments: [],
                    created_at: Date.now(),
                    metadata: null
                  }
                  addMessage(assistantMessage)
                }
                else if (data.type === 'textDelta' && messageStarted) {
                  const delta = data.data?.delta?.value || ''
                  currentMessageContent += delta
                  setStreamingContent((prev: MessageContent[]) => {
                    const newContent: MessageContent[] = prev.length > 0
                      ? [...prev.slice(0, -1), {
                        type: 'text',
                        text: {
                          value: prev[prev.length - 1].text.value + delta,
                          annotations: []
                        }
                      }]
                      : [{
                        type: 'text',
                        text: {
                          value: delta,
                          annotations: []
                        }
                      }]
                    return newContent
                  })
                }
                else if (data.type === 'end' && messageStarted) {
                  // Store the final message in the database
                  const formData = new FormData()
                  formData.append('thread_id', currentThreadId)
                  formData.append('content', currentMessageContent)
                  formData.append('role', 'assistant')

                  const storeRes = await fetch('/api/thread/message', {
                    method: 'POST',
                    body: formData
                  })

                  if (!storeRes.ok) {
                    console.error('[AssistantChat] Failed to store assistant message:', await storeRes.text())
                  } else {
                    const storeData = await storeRes.json()
                    console.log('[AssistantChat] Stored assistant message:', storeData)
                    currentMessageId = storeData.message?.id

                    // Update the message in the store with final content
                    const finalMessage: Message = {
                      id: currentMessageId || `temp-${Date.now()}`,
                      role: 'assistant' as MessageRole,
                      content: [{
                        type: 'text',
                        text: {
                          value: currentMessageContent,
                          annotations: []
                        }
                      }],
                      thread_id: currentThreadId,
                      attachments: [],
                      created_at: Date.now(),
                      metadata: null
                    }
                    addMessage(finalMessage)
                  }
                  // Clear streaming content after message is complete
                  setStreamingContent([])
                }
                else if (data.type === 'error') {
                  activeRunRef.current = null
                  throw new Error(data.data)
                }
                else if (data.type === 'end') {
                  activeRunRef.current = null
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    } catch (error) {
      console.error('[AssistantChat] Error:', error)
      setLocalError((error as Error).message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  // Form submit handler.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user' as MessageRole,
      content: [{
        type: 'text',
        text: {
          value: trimmedMessage,
          annotations: []
        }
      }],
      thread_id: threadId,
      attachments: [],
      created_at: Date.now(),
      metadata: null
    }

    addMessage(userMessage)

    await submitMessage()
  }

  // Textarea onKeyDown handler.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !submittingRef.current) {
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
    <div className="flex flex-col h-full w-full">
      {/* Messages */}
      <MessageList
        messages={storeMessages}
        streamingContent={streamingContent}
      />

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 items-center">
          {threadId && (
            <FileUpload
              threadId={threadId}
              onFileUpload={async (file, uploadPromise) => {
                setIsLoading(true);
                setLocalError(undefined);

                try {
                  console.log('[AssistantChat] File uploading:', file.name);
                  const response = await uploadPromise;

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                      errorData?.error ||
                      `Upload failed: ${response.status} ${response.statusText}`
                    );
                  }

                  console.log('[AssistantChat] File uploaded:', file.name);
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