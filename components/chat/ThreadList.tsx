'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientStore } from '@/store/clientStore'
import { TrashIcon } from '@heroicons/react/20/solid';
import { Thread } from '@/types/store'

type ThreadListProps = {
  assistantId: string;
};

export function ThreadList({ assistantId }: ThreadListProps) {
    const {
        deleteThread,
        currentAssistantId,
        currentConversation,
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
        setUserThreads
    } = useClientStore();

    

    useEffect(() => {
        if (currentAssistantId) {
            fetchUserThreads(currentAssistantId)
                .then((threads) => {
                    setUserThreads(threads);
                })
                .catch((error) => {
                    setError('Failed to load threads');
                });
        }
    }, [currentAssistantId, fetchUserThreads, setUserThreads, setError]);

    useEffect(() => {
        const loadThreads = () => {
          if (userThreads.length === 0) {
            if (currentAssistantId) {
              fetchUserThreads(currentAssistantId)
                .then((threads) => {
                    setUserThreads(threads);
                })
                .catch((error) => {
                    setError('Failed to load threads');
                });
            }
          }
        };
        
        loadThreads();
      }, [fetchUserThreads, setError, userThreads.length, currentAssistantId, setUserThreads]);

// Ensure setCurrentConversation is called with the correct type
const handleThreadChange = (threadId: string) => {
    setCurrentThreadId(threadId);
    fetchThreadMessages(threadId)
        .then((messages) => {
            setCurrentConversation(messages);
        })
        .catch((error) => {
            setError('Failed to load messages');
        });
};

    const renameThread = (threadId: string) => {
        const newTitle = prompt('Enter new title:');
        if (newTitle) {
           setThreadTitle(newTitle);
        }
    };

    const handleDeleteThread = (threadId: string) => {
        if (confirm('Are you sure you want to delete this thread?')) {
            deleteThread(threadId);
            if (currentAssistantId) {
              fetchUserThreads(currentAssistantId)
                .then((threads) => {
                    setUserThreads(threads);
                })
                .catch((error) => {
                    setError('Failed to load threads');
                });
            }
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    }

    return (
        <div className="w-full space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Chat History</h3>
            
            <ul className="max-h-full overflow-y-auto divide-y divide-gray-200">
                {userThreads.map((thread: Thread) => (
                    <li 
                        key={thread.thread_id}
                        onClick={() => handleThreadChange(thread.thread_id)}
                        className={`thread-item ${currentThreadId === thread.thread_id ? 'bg-accent' : ''} p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 truncate cursor-pointer" onClick={() => renameThread(thread.thread_id)}>
                                {thread.thread_title || "Untitled Thread"} {/* Display thread title */}
                            </span>
                            <span className="text-xs text-gray-500">
                                {thread.updated_at ? new Date(thread.updated_at).toLocaleDateString() : "No messages"} {/* Display last message date */}
                            </span>
                            <button onClick={() => handleDeleteThread(thread.thread_id)} className="text-gray-500 hover:text-red-500">
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {useClientStore.getState().error && <div className="text-red-500">{useClientStore.getState().error}</div>}
        </div>
    );
}