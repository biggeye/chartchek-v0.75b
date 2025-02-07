'use client'

import { cn } from '@/lib/utils'
import { MessageContent as MessageContentType } from '@/types/api/openai'

interface MessageContentProps {
  content: MessageContentType | MessageContentType[]
  className?: string
  isStreaming?: boolean
}

export function MessageContent({ content, className, isStreaming }: MessageContentProps) {
  const contentArray = Array.isArray(content) ? content : [content]

  return (
    <div className={cn('text-sm', className)}>
      {contentArray.map((item, i) => {
        if (item.type === 'text') {
          return (
            <div key={i} className="whitespace-pre-wrap">
              {item.text.value}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
