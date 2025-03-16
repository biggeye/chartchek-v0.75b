'use client';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DocumentTextIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { chatStore } from '@/store/chatStore';
import Image from 'next/image';
import { assistantRoster } from '@/lib/assistant/roster';
import { useStreamStore } from '@/store/streamStore';
import { renderContent as renderFormattedContent } from '@/lib/chat/renderServices';
import { ChatMessageAnnotation, ThreadMessage } from '@/types/database';

interface MessageListProps {
  isAssistantLoading?: boolean;
  isStreamingActive?: boolean;
  streamingContent?: string;
}

export const MessageList = React.memo(({
  isAssistantLoading,
  isStreamingActive,
  streamingContent
}: MessageListProps) => {
  const { currentThread, fetchOpenAIMessages, error, setError } = chatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStreamingMessage, setShowStreamingMessage] = useState(false);
  const [fadeOutActive, setFadeOutActive] = useState(false);
  const [previousStreamContent, setPreviousStreamContent] = useState<string | null>(null);

  const pdfUrl = useStreamStore(state => state.pdfPreviewUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch messages when thread ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentThread?.thread_id) return;
      setIsLoading(true);
      try {
        await fetchOpenAIMessages(currentThread.thread_id);
      } catch (error) {
        console.error('[MessageList] Error fetching messages:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [currentThread?.thread_id, fetchOpenAIMessages, setError]);

  // Handle streaming state changes
  useEffect(() => {
    if (isStreamingActive) {
      setShowStreamingMessage(true);
      setFadeOutActive(false);
      if (streamingContent) setPreviousStreamContent(streamingContent);
    } else if (showStreamingMessage && previousStreamContent) {
      setFadeOutActive(true);
      const timer = setTimeout(() => {
        setShowStreamingMessage(false);
        if (currentThread?.thread_id) {
          fetchOpenAIMessages(currentThread.thread_id);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isStreamingActive, showStreamingMessage, previousStreamContent, currentThread?.thread_id, fetchOpenAIMessages, streamingContent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages?.length, streamingContent]);

  if (!currentThread) {
    return <div className="flex-1 p-4 text-center text-muted-foreground">Select or start a new conversation</div>;
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  const messages = [...(currentThread.messages || [])].sort((a, b) => a.created_at - b.created_at);

  return (
    <ScrollArea className="h-full w-full overflow-y-auto mb-20">
      <div className="flex flex-col gap-4 p-4 pb-24">
        {messages.length === 0 && !isStreamingActive && !isAssistantLoading && (
          <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
        )}

        {messages.map((message, id) => (
          <div
            key={message.id || id}
            className={cn(
              'flex w-full items-start gap-2 rounded-lg px-4 py-2',
              message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted'
            )}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold">
                {message.role === 'user' ? 'You' : (
                  <div className="flex items-center gap-2">
                    <span>
                      {message.assistant_id 
                        ? assistantRoster.find(a => a.assistant_id === message.assistant_id)?.name || 'Assistant'
                        : 'Assistant'}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-sm opacity-90">
                {Array.isArray(message.content)
                  ? message.content.map((content, i) => (
                      <React.Fragment key={`${message.id || id}-content-${i}`}>
                        {content.type === 'text' && content.text && (
                          <div>{renderFormattedContent(content.text.value, content.text.annotations || [])}</div>
                        )}
                      </React.Fragment>
                    ))
                  : renderFormattedContent(message.content)}
              </div>
            </div>
          </div>
        ))}

        {/* PDF Message Bubble */}
        {pdfUrl && (
          <div className="flex w-full items-start gap-2 rounded-lg px-4 py-2 bg-blue-50 border border-blue-300">
            <div className="flex w-full flex-col gap-2">
              <div className="text-sm font-semibold text-blue-700 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                PDF Available
              </div>
              <div className="flex gap-4">
                <a href={pdfUrl} download className="text-blue-600">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download PDF
                </a>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-blue-600"><EyeIcon className="h-5 w-5" /> Preview</button>
                  </DialogTrigger>
                  <DialogContent>
                    <iframe src={pdfUrl} width="100%" height="800" title="PDF Preview" />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
});

MessageList.displayName = 'MessageList';
