'use client'

import { cn, Text } from '@/components/ui'
import { renderContent } from '@/lib/chat/renderServices';
import { MessageContent as MessageContentType } from '@/types/api/openai/messages'

interface MessageContentProps {
  content: MessageContentType | MessageContentType[]
  className?: string
  isStreaming?: boolean
}

interface Annotation {
  type: string
  file_id?: string
  text?: string
}

interface TextContent {
  value: string
  annotations?: Annotation[]
}

interface MessageContentItem {
  type: 'text'
  text: TextContent
}

export function MessageContent({ content, className, isStreaming }: MessageContentProps) {

  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <div className={className}>
      {contentArray.map((item, id) => {
        if (item.type === 'text') {
          return (
            <div key={id} className="prose dark:prose-invert">
              <Text>
                {renderContent(item.text.value, item.text.annotations || [])}
              </Text>
              {item.text.annotations && item.text.annotations.length > 0 && (
                <div className="annotation-footnotes mt-2">
                  {item.text.annotations.map((ann, index) => (
                    <div key={`${id}-ann-${index}`} className="text-xs text-muted-foreground">
                      [{index+1}] {ann.type}: {ann.file_id || ann.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        // Handle other content types if necessary
        return null;
      })}
    </div>
  )
}
