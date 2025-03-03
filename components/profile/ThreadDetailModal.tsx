'use client';

import React from 'react';
import DetailModal from '../DetailModal';
import DetailField from '../DetailField';
import { ChatThread } from '@/lib/services/threadService';
import { format } from 'date-fns';

interface ThreadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: ChatThread | null;
}

export default function ThreadDetailModal({ isOpen, onClose, thread }: ThreadDetailModalProps) {
  if (!thread) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DetailModal 
      isOpen={isOpen}
      onClose={onClose}
      title={`Thread Details: ${thread.title || 'Untitled Thread'}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <DetailField label="Thread ID" value={thread.thread_id} />
            <DetailField label="Title" value={thread.title || 'Untitled Thread'} />
            <DetailField label="Status" value={thread.status} />
            <DetailField label="Is Active" value={thread.is_active ? 'Yes' : 'No'} />
            <DetailField label="User ID" value={thread.user_id} />
            <DetailField label="Assistant ID" value={thread.assistant_id} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
            <DetailField label="Created At" value={formatDate(thread.created_at)} />
            <DetailField label="Updated At" value={formatDate(thread.updated_at)} />
            <DetailField label="Last Message At" value={formatDate(thread.last_message_at)} />
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Run Information</h3>
            <DetailField label="Last Run" value={thread.last_run} />
            <DetailField label="Last Run Status" value={thread.last_run_status} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
            <DetailField label="Tool Resources" value={thread.tool_resources} rows={3} />
            <DetailField label="Metadata" value={thread.metadata} rows={3} />
          </div>
        </div>
      </div>
    </DetailModal>
  );
}
