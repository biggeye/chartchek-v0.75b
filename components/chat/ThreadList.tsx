'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAssistantStore } from '@/store/assistantStore'
import { TrashIcon } from '@heroicons/react/20/solid';

export function ThreadList({ assistantId }: { assistantId: string }) {
    const {
        userThreads,
        isLoading,
        fetchThreads,
        currentThread,
        setCurrentThread,
        fetchThreadMessages,
        currentAssistant,
        updateThreadTitle,
        deleteThread
    } = useAssistantStore();

    useEffect(() => {
       fetchThreads(assistantId)
        }, [fetchThreads]);

        const handleThreadChange = async (threadId: string) => {
            const selectedThread = userThreads.find(t => t.thread_id === threadId);
            if (selectedThread) {
                await setCurrentThread(selectedThread);
                await fetchThreadMessages();
            }
        };

        const renameThread = async (threadId: string) => {
            const newTitle = prompt('Enter new title:');
            if (newTitle) {
                await updateThreadTitle(threadId, newTitle);
            }
        };

        const handleDeleteThread = async (threadId: string) => {
            if (confirm('Are you sure you want to delete this thread?')) {
                await deleteThread(threadId);
                fetchThreads(); // Refresh the thread list after deletion
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
                {userThreads.map((thread) => (
                    <li 
                        key={thread.thread_id}
                        onClick={() => handleThreadChange(thread.thread_id)}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 truncate cursor-pointer" onClick={() => renameThread(thread.thread_id)}>
                                {thread.title || "Untitled Thread"} {/* Display thread title */}
                            </span>
                            <span className="text-xs text-gray-500">
                                {thread.last_message_at ? new Date(thread.last_message_at).toLocaleDateString() : "No messages"} {/* Display last message date */}
                            </span>
                            <button onClick={() => handleDeleteThread(thread.thread_id)} className="text-gray-500 hover:text-red-500">
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}