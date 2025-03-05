'use client';

import React from 'react';
import DetailModal from '../detail-modal';
import DetailField from '../detail-field';
import { ThreadRun } from '@/types/store/newStream';
import { format } from 'date-fns';

interface ThreadRunDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: ThreadRun | null;
}

export default function ThreadRunDetailModal({ isOpen, onClose, run }: ThreadRunDetailModalProps) {
  if (!run) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (e) {
      return dateString;
    }
  };

  const getCompletionStatus = () => {
    if (run.completed_at) return `Completed: ${formatDate(run.completed_at)}`;
    if (run.cancelled_at) return `Cancelled: ${formatDate(run.cancelled_at)}`;
    if (run.failed_at) return `Failed: ${formatDate(run.failed_at)}`;
    return 'Not completed';
  };

  return (
    <DetailModal 
      isOpen={isOpen}
      onClose={onClose}
      title={`Run Details: ${run.run_id}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <DetailField label="Run ID" value={run.run_id} />
            <DetailField label="Thread ID" value={run.thread_id} />
            <DetailField label="Assistant ID" value={run.assistant_id} />
            <DetailField label="User ID" value={run.user_id} />
            <DetailField label="Status" value={run.status} />
            <DetailField label="Model" value={run.model || 'N/A'} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
            <DetailField label="Created At" value={formatDate(run.created_at)} />
            <DetailField label="Updated At" value={formatDate(run.updated_at)} />
            <DetailField label="Started At" value={formatDate(run.started_at)} />
            <DetailField label="Completion Status" value={getCompletionStatus()} />
            <DetailField label="Expires At" value={formatDate(run.expires_at)} />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Details</h3>
            <DetailField label="Instructions" value={run.instructions} rows={3} />
            <DetailField label="Tools" value={run.tools} rows={3} />
            <DetailField label="Required Action" value={run.required_action} rows={2} />
            <DetailField label="Last Error" value={run.last_error || 'None'} rows={2} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
            <DetailField label="Temperature" value={run.temperature} />
            <DetailField label="Top P" value={run.top_p} />
            <DetailField label="Max Prompt Tokens" value={run.max_prompt_tokens} />
            <DetailField label="Max Completion Tokens" value={run.max_completion_tokens} />
            <DetailField label="Truncation Strategy" value={run.truncation_strategy} />
            <DetailField label="Response Format" value={run.response_format} rows={2} />
            <DetailField label="Tool Choice" value={run.tool_choice} rows={2} />
            <DetailField label="Parallel Tool Calls" value={run.parallel_tool_calls ? 'Enabled' : 'Disabled'} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Token Usage</h3>
            <DetailField label="Prompt Tokens" value={run.prompt_tokens?.toLocaleString() || 'N/A'} />
            <DetailField label="Completion Tokens" value={run.completion_tokens?.toLocaleString() || 'N/A'} />
            <DetailField label="Total Tokens" value={run.total_tokens?.toLocaleString() || 'N/A'} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            <DetailField label="Metadata" value={run.metadata} rows={3} />
          </div>
        </div>
      </div>
    </DetailModal>
  );
}
