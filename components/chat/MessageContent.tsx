'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { MessageContent as MessageContentType } from '@/types/types'

interface MessageContentProps {
  content: MessageContentType[]
  isStreaming?: boolean
}

export function MessageContent({ content, isStreaming = false }: MessageContentProps) {
  return (
    <div className="space-y-4">
      {content.map((item, index) => (
        <div 
          key={index} 
          className={`prose dark:prose-invert max-w-none ${isStreaming ? 'animate-pulse' : ''}`}
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                return (
                  <code
                    className={`${className} ${inline ? 'inline-code' : 'block-code'} bg-muted p-1 rounded`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {item.text}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  )
}
