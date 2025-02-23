'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientStore } from '@/store/clientStore'
import { useCurrentThread, useThreadActions } from '@/store/threadStore'
import { TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import { Thread } from '@/types/store/client'
import Tooltip from '@/components/ui/Tooltip'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

type ThreadListProps = {
  assistantId: string
}

export function ThreadList({ assistantId }: ThreadListProps) {
  const {
    createThread,
    deleteThread,
    currentAssistantId,
    currentThreadId,
    userThreads,
    fetchUserThreads,
    fetchThreadMessages,
    setCurrentThreadId,
    setCurrentConversation,
    setThreadTitle,
    isLoading,
    error,
    setError,
    setUserThreads,
    fetchThreadDetails,
  } = useClientStore()

  const currentThread = useCurrentThread()
  const { fetchMergedDocuments, initializeThread, toggleStagedFile } = useThreadActions()

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [fileNames, setFileNames] = useState<Record<string, string[]>>({})
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
};
  // Automatically set a thread if none is selected
  useEffect(() => {
    if (!currentThreadId && userThreads.length > 0) {
      setCurrentThreadId(userThreads[0].thread_id)
    }
  }, [currentThreadId, userThreads])

  // Fetch file names for tooltips
  const fetchFileNames = async (threadId: string) => {
    try {
      const fileIds = await fetchThreadDetails(threadId)
      const { data, error } = await supabase
        .from('documents')
        .select('file_name')
        .in('openai_file_id', fileIds)
      if (error) throw error
      setFileNames(prev => ({ ...prev, [threadId]: data.map((doc: any) => doc.file_name) }))
    } catch (err) {
      // Error handled elsewhere
    }
  }

  // Fetch user threads on mount/when assistant changes
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const threads = await fetchUserThreads(currentAssistantId)
        if (isMounted) setUserThreads(threads)
        threads.forEach(thread => fetchFileNames(thread.thread_id))
      } catch (err) {
        if (isMounted) setError('Failed to load threads')
      }
    }
    if (currentAssistantId) {
      fetchData()
    }
    return () => { isMounted = false }
  }, [])



  const handleThreadChange = (threadId: string) => {
    setCurrentThreadId(threadId)
    fetchThreadMessages(threadId)
      .then((messages) => {
        setCurrentConversation(messages)
      })
      .catch((error) => {
        setError('Failed to load messages')
      })
  }

  const renameThread = (threadId: string) => {
    const newTitle = prompt('Enter new title:')
    if (newTitle) {
      setThreadTitle(threadId, newTitle)
      fetchUserThreads(currentAssistantId)
    }
  }

  const handleDeleteThread = (threadId: string) => {
    deleteThread(threadId)
  }

  const handleAddThread = () => {
    createThread(currentAssistantId)
  }

  const handleRefreshThreads = () => {
    if (currentAssistantId) {
      fetchUserThreads(currentAssistantId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  if (error) return <div className="p-4 text-red-500">Error loading threads: {error}</div>
  if (!isLoading && userThreads.length === 0) return <div className="p-4 text-gray-500">No conversations found</div>

  return (
    <div className="thread-list-container">
      <div className="thread-list-actions">
        <button onClick={handleAddThread} className="add-thread-button">
          <PlusIcon className="icon" aria-hidden="true" />
        </button>
        <button onClick={handleRefreshThreads} className="refresh-thread-button">
          <ArrowPathIcon className="icon" aria-hidden="true" />
        </button>
      </div>
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Chat History</h3>
          <button className="transition-transform duration-300 ease-in-out text-xs text-blue-500" onClick={toggleEditMode}>
            {isEditing ? 'CANCEL' : 'EDIT'}
          </button>
        </div>
        <ul className="max-h-full overflow-y-auto divide-y divide-gray-200">
          {userThreads.map((thread: Thread) => (
            <li
              key={thread.thread_id}
              onClick={() => handleThreadChange(thread.thread_id)}
              className={`thread-item ${currentThreadId === thread.thread_id ? 'bg-accent' : ''} p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out`}
            >
              <div className="flex items-center justify-between">
                <Tooltip content={fileNames[thread.thread_id]?.join(', ') || 'No files attached'}>
                  <span className="text-sm text-gray-900 truncate">
                    {thread.title || 'Untitled'}
                  </span>
                </Tooltip>
                {isEditing && (
                  <div className="flex space-x-2">
                    <button className="text-xs text-blue-500" onClick={() => renameThread(thread.thread_id)}>Rename</button>
                    <button className="text-xs text-red-500" onClick={() => handleDeleteThread(thread.thread_id)}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {useClientStore.getState().error && <div className="text-red-500">{useClientStore.getState().error}</div>}
      </div>
    </div>
  )
}
