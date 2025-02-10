'use client'

import { cn } from '@/lib/utils'
import { MessageContent as MessageContentType } from '@/types/api/openai/messages'

interface MessageContentProps {
  content: MessageContentType | MessageContentType[]
  className?: string
  isStreaming?: boolean
}

export function MessageContent({ content, className, isStreaming }: MessageContentProps) {

  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <div className={className}>
      {contentArray.map((item, id) => {
        if (item.type === 'text') {
          return <span key={id}>{item.text.value}</span>; // Access the value correctly
        }
        // Handle other content types if necessary
        return null;
      })}
    </div>
  )
}
