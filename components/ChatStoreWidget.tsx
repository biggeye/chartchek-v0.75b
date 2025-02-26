import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { ScrollArea } from './ui/scroll-area';

const ChatStoreWidget: React.FC = () => {
  const { fetchFileNames } = useChatStore();
  const chatState = useChatStore.getState();
  const [logs, setLogs] = useState<string[]>([]);
  const [filenames, setFilenames] = useState<string[]>([]);
  const prevStateRef = useRef(chatState);
  const currentThreadId = chatState.currentThread?.thread_id;
  const currentThreadTitle = chatState.currentThread?.title;
  const vectorStoreId = chatState.currentThread?.tool_resources?.file_search?.vector_store_ids?.[0];

  useEffect(() => {
    // Subscribe to chatStore updates and log changes
    const unsubscribe = useChatStore.subscribe((newState) => {
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

  useEffect(() => {
    if (vectorStoreId) {
      fetchFileNames(vectorStoreId)
        .then((fetchedFileNames: string[]) => {
          setFilenames(fetchedFileNames);
        })
        .catch((err) => {
          console.error('Error fetching file names:', err);
          setFilenames([]);
        });
    } else {
      setFilenames([]);
    }
  }, [vectorStoreId]);

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

      <h4 style={{ margin: '0 0 10px 0' }}>{currentThreadTitle ?? currentThreadId}</h4>
      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
        Vector Store ID: {vectorStoreId}
      </pre>
      {vectorStoreId && filenames.length > 0 && (
        <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '5px' }}>
          File Names: {filenames.join(', ')}
        </div>
      )}

    </div>
  );
};

export default ChatStoreWidget;
