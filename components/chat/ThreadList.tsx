'use client'

import { useEffect, useState } from 'react'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import Tooltip from '@/components/ui/Tooltip'
import { chatStore } from '@/store/chatStore'
import { Thread } from '@/types/store/chat'

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
  } = chatStore()

  const [isEditing, setIsEditing] = useState<boolean>(false)

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }


  useEffect(() => {
    fetchHistoricalThreads()
  }, [assistantId])

  const handleThreadChange = (threadId: string) => {
    const selectedThread = historicalThreads.find((t: Thread) => t.thread_id === threadId)
    if (selectedThread) {
      setCurrentThread(selectedThread);
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
      }
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread(threadId)
    } catch (error) {
      console.error('Delete thread error:', error)
    }
  }

  const handleAddThread = () => {
    // Ensure assistantId is provided, otherwise use a default ID or show an error
    if (!assistantId) {
      setError('No assistant ID provided for new thread creation');
      return;
    }
    createThread(assistantId)
  }

  const handleRefreshThreads = () => {
      fetchHistoricalThreads()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  if (error) return <div className="p-4 text-red-500">Error loading threads: {error}</div>
  if (!isLoading && historicalThreads.length === 0)
    return <div className="p-4 text-gray-500">No conversations found</div>

  return (
    <div>
      <div className="top-2flex space-x-2">
        <button onClick={handleAddThread} className="add-thread-button">
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
        <ul className="max-h-full overflow-y-auto divide-y divide-gray-200">
          {historicalThreads.map((thread: Thread) => (
            <li
              key={thread.thread_id}
              onClick={() => handleThreadChange(thread.thread_id)}
              className={`thread-item ${
                currentThread && currentThread.thread_id === thread.thread_id
                  ? 'bg-accent'
                  : ''
              } p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out`}
            >
              <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 truncate">
                    {thread.title || 'Untitled'}
                  </span>
                {isEditing && (
                  <div className="flex space-x-2">
                    <button
                      className="text-xs text-blue-500"
                      onClick={() => renameThread(thread.thread_id)}
                    >
                      Rename
                    </button>
                    <button
                      className="text-xs text-red-500"
                      onClick={() => handleDeleteThread(thread.thread_id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  )
}
