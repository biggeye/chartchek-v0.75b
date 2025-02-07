'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAssistantStore } from '@/store/assistantStore'

export function ThreadList() {
    const {
        userThreads,
        isLoading,
        fetchThreads,
        setCurrentThread,
        fetchThreadMessages
    } = useAssistantStore();

    useEffect(() => {
       fetchThreads()
        }, [fetchThreads]);

        const handleThreadChange = async (threadId: string) => {
            const selectedThread = userThreads.find(t => t.id === threadId);
            if (selectedThread) {
                await setCurrentThread(selectedThread);
                await fetchThreadMessages();
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
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                {userThreads.map((thread) => (
                    <li 
                        key={thread.id}
                        onClick={() => handleThreadChange(thread.id)}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900 truncate">
                                {thread.id}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(thread.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
            {userThreads.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                    No chat history available
                </div>
            )}
        </div>
    )
}