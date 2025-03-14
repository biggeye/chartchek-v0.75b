import React, { useState } from 'react';
import { ThreadRun } from '@/types/store/stream';
import { formatDistanceToNow, isValid, parseISO, format } from 'date-fns';
import ThreadRunDetailModal from './ThreadRunDetailModal';

interface ThreadRunsTableProps {
  runs: ThreadRun[];
  isLoading: boolean;
}

export default function ThreadRunsTable({ runs, isLoading }: ThreadRunsTableProps) {
  const [selectedRun, setSelectedRun] = useState<ThreadRun | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (run: ThreadRun) => {
    setSelectedRun(run);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        console.warn(`Invalid date: ${dateString}`);
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return 'Date error';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading runs...</div>;
  }

  if (!runs || runs.length === 0) {
    return <div className="text-center py-4">No thread runs found</div>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Run ID
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
                Completed
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tokens
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Additional Instructions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runs.map((run) => (
              <tr 
                key={run.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(run)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {run.run_id ? run.run_id.substring(0, 12) + '...' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {run.thread_id ? run.thread_id.substring(0, 12) + '...' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    run.status === 'completed' ? 'bg-green-100 text-green-800' :
                    run.status === 'failed' ? 'bg-red-100 text-red-800' :
                    run.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(run.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(run.completed_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {run.total_tokens !== null && run.total_tokens !== undefined 
                    ? run.total_tokens.toLocaleString() 
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {run.additional_instructions || 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <ThreadRunDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        run={selectedRun}
      />
    </>
  );
}
