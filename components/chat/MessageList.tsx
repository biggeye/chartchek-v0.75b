'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageContent as MessageContentComponent } from './MessageContent'
import { Message, MessageContent, ChatMessageAnnotation } from '@/types/api/openai/messages'
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useAssistantStore } from '@/store/assistantStore';

interface MessageListProps {
  messages?: Message[]
  streamingContent?: MessageContent[]
}

// New helper function to render annotated content
function renderAnnotatedContent(text: string, annotations: ChatMessageAnnotation[]): React.ReactNode[] {
  const footnotes: React.ReactNode[] = [];
  const regex = /【(\d+):(\d+)†([^】]+)】/g;
  let lastIndex = 0;
  let refIndex = 1;
  let match: RegExpExecArray | null;
  let cleanedText = '';

  while ((match = regex.exec(text)) !== null) {
    // Append text before this match to cleanedText
    cleanedText += text.slice(lastIndex, match.index);

    // Capture the preceding up to 35 characters and form a tooltip snippet
    const snippetStart = Math.max(match.index - 35, 0);
    const snippet = text.slice(snippetStart, match.index);
    const tooltipSnippet = '...' + snippet;

    // Combine the text after '†' (match[3]) with the tooltip snippet
    const combinedTooltip = `${match[3]} ${tooltipSnippet}`;

    // Create a footnote element that only displays the reference number, with extra info in the tooltip
    footnotes.push(
      <div key={`foot-${refIndex}`} style={{ display: 'inline-block', marginRight: '4px', textAlign: 'center' }}>
        <sup style={{ cursor: 'pointer' }} title={combinedTooltip}>{refIndex}</sup>
      </div>
    );
    refIndex++;
    lastIndex = regex.lastIndex;
  }
  // Append the remaining text after the last match
  cleanedText += text.slice(lastIndex);

  // Additional formatting for **[any given text]** patterns
  const boldPattern = /(?:\d+\.)?\s*\*\*(.*?)\*\*:?/g;
  let boldMatch: RegExpExecArray | null;
  let formattedText: React.ReactNode[] = [];
  let lastBoldIndex = 0;

  while ((boldMatch = boldPattern.exec(cleanedText)) !== null) {
    // Append text before the bold pattern
    formattedText.push(cleanedText.slice(lastBoldIndex, boldMatch.index));

    // Bold the text and start a new paragraph
    formattedText.push(<p key={`bold-${boldMatch.index}`}><strong>{boldMatch[1]}</strong></p>);

    // Start a new paragraph immediately after
    formattedText.push(<p key={`para-after-bold-${boldMatch.index}`}></p>);

    lastBoldIndex = boldPattern.lastIndex;
  }
  // Append any remaining text after the last bold match
  formattedText.push(cleanedText.slice(lastBoldIndex));

  return [
    <span key="main-text">{formattedText}</span>,
    <div key="footnotes" className="annotation-footnotes">{footnotes}</div>
  ];
}

export function MessageList({ messages = [], streamingContent = [] }: MessageListProps) {
console.log('Rendering MessageList with messages:', messages, 'and streamingContent:', streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <ScrollArea className="h-[calc(100vh-5rem)] w-full">
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id || `temp-${message.created_at}`}
            className={cn(
              'flex flex-col gap-2 p-4 rounded-lg',
              message.role === 'user' ? 'bg-muted/50' : 'bg-primary/5'
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            {message.content && Array.isArray(message.content) && message.content[0] && message.content[0].text ? (
              message.content[0].text.annotations ? (
                renderAnnotatedContent(message.content[0].text.value, message.content[0].text.annotations)
              ) : (
                renderAnnotatedContent(message.content[0].text.value, [])
              )
            ) : message.content && !Array.isArray(message.content) && message.content.text ? (
              renderAnnotatedContent(message.content.text.value, [])
            ) : null}
          </div>
        ))}

        {streamingContent && streamingContent.length > 0 && (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-primary/5">
            <div className="text-xs font-medium text-muted-foreground">
              Assistant
            </div>
            <MessageContentComponent content={streamingContent} isStreaming />
          </div>
        )}
               <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}