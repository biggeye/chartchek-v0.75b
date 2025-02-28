import React, { useEffect, useState, useRef } from 'react';
import { chatStore } from '@/store/chatStore';
import { useNewStreamingStore } from '@/store/newStreamStore';
import { ScrollArea } from './ui/scroll-area';

const ChatStoreWidget: React.FC = () => {

  const chatState = chatStore.getState();
  const newStreamingState = useNewStreamingStore.getState();

  const streamingActive = newStreamingState.isStreamingActive;
   const [logs, setLogs] = useState<string[]>([]);
  const [filenames, setFilenames] = useState<string[]>([]);
  const prevStateRef = useRef(chatState);
  const currentThreadId = chatState.currentThread?.thread_id;
  const currentThreadTitle = chatState.currentThread?.title;
  const vectorStoreId = chatState.currentThread?.tool_resources?.file_search?.vector_store_ids?.[0];
  const activeRunStatus = chatStore.getState().activeRunStatus;
  
  useEffect(() => {
    // Subscribe to chatStore updates and log changes
    const unsubscribe = chatStore.subscribe((newState) => {
      const diffs: string[] = [];
      const typedNewState = newState as Record<string, any>;
      const typedPrevState = prevStateRef.current as Record<string, any>;
      
      for (const key in typedNewState) {
        // Use JSON.stringify to handle object comparisons
        if (JSON.stringify(typedNewState[key]) !== JSON.stringify(typedPrevState[key])) {
          diffs.push(`${key} changed: ${JSON.stringify(typedPrevState[key])} -> ${JSON.stringify(typedNewState[key])}`);
        }
      }
      if (diffs.length > 0) {
        setLogs((prev) => [...prev, ...diffs]);
      }
      prevStateRef.current = newState;
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 300,
        right: 0,
        background: 'rgba(255,255,255,0.5)',
        padding: '10px',
        border: '1px solid #ccc',
        maxWidth: '30vw',
        maxHeight: '40vh',
        overflowY: 'hidden',
        zIndex: 1000,
      }}
    > 

      <h5 style={{ margin: '0 0 10px 0' }}>{currentThreadId?.slice(6, 15)}</h5>
      <h6 style={{ margin: '0 0 10px 0' }}>{currentThreadTitle? currentThreadTitle : null}</h6>
      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
        <span>Streaming: {streamingActive ? 'Active' : 'Inactive'}</span>
        <br />
        <span>Run Status: {activeRunStatus?.isActive ? 'Active' : 'Inactive'}</span>
        
      </pre>
      {vectorStoreId  && (
        <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '5px' }}>
           <span>Vector Store ID: {vectorStoreId.slice(0, 6)}...{vectorStoreId.slice(-4)}</span> // display vectorStoreId, only first 6 characters '...' and last 4 characters
        </div>
      )}

    </div>
  );
};

export default ChatStoreWidget;
