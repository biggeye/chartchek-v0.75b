import { useState, useCallback, useRef } from 'react'
import type { MessageContent, MessageRole } from '@/types/api/openai'
import { useClientStore } from '@/store/clientStore'
import { Message } from '@/types/store'

interface UseStreamingReturn {
  streamingContent: MessageContent[]
  handleStream: () => Promise<void>
  setStreamingContent: React.Dispatch<React.SetStateAction<MessageContent[]>>
}

export const useStreaming = (): UseStreamingReturn => {
  const assistantId = useClientStore((state) => state.currentAssistantId)
  // Note: your currentThread in the store should be set by your component (as you did with setThreadId)
  const threadId = useClientStore((state) => state.currentThreadId)
  const [streamingContent, setStreamingContent] = useState<MessageContent[]>([])
  const activeRunRef = useRef<string | null>(null)
  const abortCtrlRef = useRef<AbortController | null>(null)

  // For accumulating the full message text and any annotations
  const accumulated = useRef<{ currentText: string; annotations: any[] }>({
    currentText: '',
    annotations: []
  }).current

  // This function is called to start and handle a streaming run.
  // It uses similar logic as your old code so that:
  // • A textCreated event initializes the message (and you could create an initial store entry)
  // • textDelta events update the currently streaming message in state
  // • The final “end” event posts the full message to your backend and clears the streaming UI.
  const handleStream = useCallback(async () => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort()
    }
    abortCtrlRef.current = new AbortController()

    // Reset accumulated text for this run
    accumulated.currentText = ''
    accumulated.annotations = []

    try {
      const runResponse = await fetch('/api/thread/run/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thread_id: threadId,
          assistant_id: assistantId
        }),
        signal: abortCtrlRef.current.signal
      })

      if (!runResponse.ok) {
        const errData = await runResponse.json().catch(() => null)
        console.error('[AssistantChat] Failed to start run:', errData)
        throw new Error(errData?.error || 'Failed to start run')
      }

      activeRunRef.current = Date.now().toString()
      const reader = runResponse.body?.getReader()
      if (!reader) {
        throw new Error('No response stream available')
      }

      let currentMessageId: string | null = null
      let messageStarted = false
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            activeRunRef.current = null
            break
          }

          const text = decoder.decode(value, { stream: true })
          // Split into individual lines (each line begins with "data: ")
          const lines = text.split('\n').filter(line => line.trim() !== '')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              // When the assistant message starts, create an initial empty message.
              if (data.type === 'textCreated') {
                messageStarted = true
                accumulated.currentText = ''
                accumulated.annotations = []
                // Option: create an initial empty message entry
                // You could call your addMessageIfNotEmpty helper from AssistantChat or
                // update your message store with a temporary message.
                // For example:
                // addMessageIfNotEmpty({
                //   id: currentMessageId || `temp-${Date.now()}`,
                //   role: 'assistant' as MessageRole,
                //   content: [{
                //     type: 'text',
                //     text: { value: '', annotations: [] }
                //   }],
                //   thread_id: threadId,
                //   attachments: [],
                //   created_at: Date.now(),
                //   metadata: null
                // })
              }
              // Append incremental content to the streaming message.
              else if (data.type === 'textDelta' && messageStarted) {
                const delta = data.data?.delta?.value || ''
                const newAnnotations = data.data?.delta?.annotations || []
                accumulated.currentText += delta
                accumulated.annotations = [...accumulated.annotations, ...newAnnotations]
                // Update the streaming content.
                setStreamingContent((prev: MessageContent[]) => {
                  if (prev.length > 0) {
                    // Append delta to the last element.
                    const last = prev[prev.length - 1]
                    const updatedText = last.text.value + delta
                    const updatedAnnotations = [
                      ...(last.text.annotations || []),
                      ...newAnnotations
                    ]
                    return [
                      ...prev.slice(0, -1),
                      { type: 'text', text: { value: updatedText, annotations: updatedAnnotations } }
                    ]
                  } else {
                    return [{ type: 'text', text: { value: delta, annotations: newAnnotations } }]
                  }
                })
              }
              // When the stream ends, store the assistant message.
              else if (data.type === 'end' && messageStarted) {
                // Prepare the data to store the assistant's final message.
                const formData = new FormData()
                formData.append('thread_id', threadId!)
                formData.append('content', accumulated.currentText)
                formData.append('annotations', JSON.stringify(accumulated.annotations))
                formData.append('role', 'assistant')
                const storeRes = await fetch('/api/thread/message', {
                  method: 'POST',
                  body: formData,
                })

                if (!storeRes.ok) {
                  console.error('[AssistantChat] Failed to store assistant message:', await storeRes.text())
                } else {
                  const storeData = await storeRes.json()
                  console.log('[AssistantChat] Stored assistant message:', storeData)
                  currentMessageId = storeData.message?.id
                  // Option: you can update your message store with the final message now.
                  // For example:
                  // addMessageIfNotEmpty({
                  //   id: currentMessageId || `temp-${Date.now()}`,
                  //   role: 'assistant' as MessageRole,
                  //   content: [{
                  //     type: 'text',
                  //     text: { value: accumulated.currentText, annotations: accumulated.annotations }
                  //   }],
                  //   thread_id: threadId,
                  //   attachments: [],
                  //   created_at: Date.now(),
                  //   metadata: null
                  // })
                }
                // Clear the streaming content once the message is complete.
                setStreamingContent([])
              }
              // If there is an error event.
              else if (data.type === 'error') {
                activeRunRef.current = null
                throw new Error(data.data)
              }
              // In case of duplicate "end" events.
              else if (data.type === 'end') {
                activeRunRef.current = null
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error: any) {
      console.error('[AssistantChat] Error:', error)
      // Option: bubble up the error by setting an error state in your component.
    } finally {
      abortCtrlRef.current = null
    }
  }, [assistantId, threadId, setStreamingContent, accumulated])

  return {
    streamingContent,
    handleStream,
    setStreamingContent
  }
}

export default useStreaming