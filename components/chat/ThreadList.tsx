'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientStore } from '@/store/clientStore'
import { TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import { Thread } from '@/types/store'

type ThreadListProps = {
    assistantId: string;
};

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

    } = useClientStore();

    const [isEditing, setIsEditing] = useState<boolean>(false);

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    useEffect(() => {
        if (currentAssistantId && userThreads.length === 0) {
            fetchUserThreads(currentAssistantId)
                .then((threads) => {
                    setUserThreads(threads);
                })
                .catch((error) => {
                    setError('Failed to load threads');
                });
        }
    }, [currentAssistantId, fetchUserThreads, setUserThreads, setError, userThreads.length]);

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
            setThreadTitle(threadId, newTitle);
            fetchUserThreads(assistantId);
        }
    };

    const handleDeleteThread = (threadId: string) => {
        if (confirm('Are you sure you want to delete this thread?')) {
            deleteThread(threadId);
            if (assistantId) {
                fetchUserThreads(assistantId)
                    .then((threads) => {
                        setUserThreads(threads);
                    })
                    .catch((error) => {
                        setError('Failed to load threads');
                    });
            }
        }
    };

    const handleAddThread = () => {
        createThread();
    };

    const handleRefreshThreads = () => {
        if (currentAssistantId) {
            fetchUserThreads(currentAssistantId);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    }
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
                            className={`thread-item ${currentThreadId === thread.thread_id ? 'bg-accent' : ''} p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out transition-bg`}
                        >
                            <div className="flex items-center justify-between transition-opacity">
                                <span
                                    className="text-sm text-gray-900 truncate cursor-pointer transition-transform"
                                >
                                    {thread.title}
                                </span>
                                {isEditing && (
                                    <div className="flex space-x-2">
                                        <button className="text-xs text-blue-500 transition-transform duration-300 ease-in-out" onClick={() => renameThread(thread.thread_id)}>Rename</button>
                                        <button className="text-xs text-red-500 transition-transform duration-300 ease-in-out" onClick={() => handleDeleteThread(thread.thread_id)}>Delete</button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                {useClientStore.getState().error && <div className="text-red-500">{useClientStore.getState().error}</div>}
            </div>
        </div>
    );
}