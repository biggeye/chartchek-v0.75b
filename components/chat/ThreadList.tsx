'use client'

import { useEffect, useState } from 'react'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import { useChatStore } from '@/store/chatStore'
import { Thread } from '@/types/store/chat'
import { ScrollArea } from '../ui/scroll-area'

interface MessageContentItem {
  type?: string;
  text?: {
    value: string;
    annotations?: any[];
  };
}

export function ThreadList({ assistantId }: { assistantId?: string }) {
  const {
    historicalThreads,
    currentThread,
    setCurrentThread,
    fetchHistoricalThreads,
    deleteThread,
    createThread,
    setError,
    error,
    isLoading,
    updateThreadTitle,
    fetchOpenAIMessages,
    checkActiveRun
  } = useChatStore()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isThreadLoading, setIsThreadLoading] = useState<string | null>(null)

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  useEffect(() => {
    fetchHistoricalThreads()
  }, [assistantId])

  const handleThreadChange = async (threadId: string) => {
    try {
      setIsThreadLoading(threadId)
      const selectedThread = historicalThreads.find((t: Thread) => t.thread_id === threadId)
      if (selectedThread) {
        setCurrentThread(selectedThread)

        // Fetch messages after setting the thread
        const messages = await fetchOpenAIMessages(threadId)

        // Check for active run on thread load
        const runStatus = await checkActiveRun(threadId)

        // If the thread has a default title, generate a better one from the first user message

        // Check for default title with more flexible matching
        const hasDefaultTitle = selectedThread.title && (
          selectedThread.title.toLowerCase().includes('new chat') ||
          selectedThread.title === 'New conversation' ||
          selectedThread.title === 'New thread'
        );

        if (hasDefaultTitle && messages && messages.length > 0) {
          // Find the first user message
          const firstUserMessage = messages.find(msg => msg.role === 'user')
          if (firstUserMessage && firstUserMessage.content) {

            // Extract content text from the message
            let messageContent = ''

            if (Array.isArray(firstUserMessage.content)) {
              // Handle array content format
              const textContent = firstUserMessage.content.find((item: MessageContentItem) => item.type === 'text')
              if (textContent && textContent.text) {
                messageContent = textContent.text.value || ''
              } else {
                // Try to extract text from any content item that might have text
                for (const item of firstUserMessage.content as MessageContentItem[]) {
                  if (item.text && item.text.value) {
                    messageContent = item.text.value;
                    break;
                  }
                }
              
            
            
          }
        } else if (typeof firstUserMessage.content === 'string') {
          // Handle string content format
          messageContent = firstUserMessage.content
        } else {
          // Try to extract text from the content object if it's not an array or string
          if (firstUserMessage.content && typeof firstUserMessage.content === 'object') {
            const contentStr = JSON.stringify(firstUserMessage.content);
            messageContent = contentStr.substring(0, 100); // Use first 100 chars for title generation
          }
        }

        if (messageContent.trim()) {
          console.log ('ThreadList] message content:  ', messageContent)
          try {
            // Generate a title using the API
            const response = await fetch(`/api/openai/threads/${threadId}/generate-title`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: messageContent })
            })

            if (response.ok) {
              const data = await response.json();
              if (data.title) {
                // Update the thread title
                await updateThreadTitle(threadId, data.title);

                // Refresh the thread list to show the updated title
                fetchHistoricalThreads();
              }
            }
          } catch (titleError) {
            console.error('Error generating title:', titleError)
            // Continue with the default title if generation fails
          }
        }
      }
    }
      }
} catch (error) {
  console.error('Error changing thread:', error)
  setError(error instanceof Error ? error.message : 'Failed to load thread messages')
} finally {
  setIsThreadLoading(null)
}
  }

const renameThread = async (threadId: string) => {
  const newTitle = prompt('Enter new title:')
  if (newTitle) {
    try {
      await updateThreadTitle(threadId, newTitle)
      if (currentThread && currentThread.thread_id === threadId) {
        setCurrentThread({ ...currentThread, title: newTitle })
      }
      // Refresh threads after renaming.
      await fetchHistoricalThreads()
    } catch (error) {
      console.error('Rename thread error:', error)
      setError(error instanceof Error ? error.message : 'Failed to rename thread')
    }
  }
}

const handleDeleteThread = async (threadId: string) => {
  try {
    await deleteThread(threadId)
  } catch (error) {
    console.error('Delete thread error:', error)
    setError(error instanceof Error ? error.message : 'Failed to delete thread')
  }
}

const handleAddThread = async () => {
  if (!assistantId) {
    setError('No assistant ID provided for new thread creation')
    return
  }
  try {
    await createThread(assistantId)
  } catch (error) {
    console.error('Create thread error:', error)
    setError(error instanceof Error ? error.message : 'Failed to create thread')
  }
}

const handleRefreshThreads = async () => {
  try {
    await fetchHistoricalThreads()
  } catch (error) {
    console.error('Refresh threads error:', error)
    setError(error instanceof Error ? error.message : 'Failed to refresh threads')
  }
}

if (isLoading) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}

return (
  <div>
    <div className="top-2 flex space-x-2">
      <button
        onClick={handleAddThread}
        className="add-thread-button"
        disabled={!assistantId}
      >
        <PlusIcon className="icon" />
      </button>
      <button onClick={handleRefreshThreads} className="refresh-thread-button">
        <ArrowPathIcon className="icon" />
      </button>
    </div>
    <div className="w-full top-15 space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Chat History</h3>
        <button
          className="transition-transform duration-300 ease-in-out text-xs text-blue-500"
          onClick={toggleEditMode}
        >
          {isEditing ? 'CANCEL' : 'EDIT'}
        </button>
      </div>
      {error && (
        <div className="p-2 text-sm text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}
      {!isLoading && historicalThreads.length === 0 ? (
        <div className="p-4 text-gray-500">No conversations found</div>
      ) : (
        <ScrollArea className="max-h-full overflow-y-auto divide-y divide-gray-200">
          <ul className="max-h-full overflow-y-auto divide-y divide-gray-200">
            {historicalThreads.map((thread: Thread) => (
              <li
                key={thread.thread_id}
                onClick={() => !isThreadLoading && handleThreadChange(thread.thread_id)}
                className={`thread-item ${currentThread && currentThread.thread_id === thread.thread_id
                    ? 'bg-accent'
                    : ''
                  } ${isThreadLoading === thread.thread_id ? 'opacity-50' : ''
                  } p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isThreadLoading === thread.thread_id && (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    )}
                    <span className="text-sm text-gray-900 truncate">
                      {thread.title || 'Untitled'}
                    </span>
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <button
                        className="text-xs text-blue-500 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          renameThread(thread.thread_id)
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteThread(thread.thread_id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  </div>
)
}
