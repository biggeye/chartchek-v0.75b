import React, { useState } from 'react';
import { ChatThread } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import ThreadDetailModal from './ThreadDetailModal';

interface ThreadsTableProps {
  threads: ChatThread[];
  isLoading: boolean;
}

export default function ThreadsTable({ threads, isLoading }: ThreadsTableProps) {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (thread: ChatThread) => {
    setSelectedThread(thread);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading threads...</div>;
  }

  if (!threads || threads.length === 0) {
    return <div className="text-center py-4">No threads found</div>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thread ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {threads.map((thread) => (
              <tr 
                key={thread.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors" 
                onClick={() => handleRowClick(thread)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {thread.title || 'Untitled Thread'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {thread.thread_id ? thread.thread_id.substring(0, 12) + '...' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    thread.status === 'completed' ? 'bg-green-100 text-green-800' :
                    thread.status === 'failed' ? 'bg-red-100 text-red-800' :
                    thread.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {thread.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {thread.created_at ? formatDistanceToNow(new Date(thread.created_at), { addSuffix: true }) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {thread.is_active ? 
                    <span className="text-green-600">Yes</span> : 
                    <span className="text-red-600">No</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ThreadDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thread={selectedThread}
      />
    </>
  );
}
