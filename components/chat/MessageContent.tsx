'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'
import { MessageContent as MessageContentType } from '@/types/types'
import { TypographyInlineCode } from '@/components/typography/inline-code'

interface MessageContentProps {
  content: MessageContentType[]
  isStreaming?: boolean
}

export function MessageContent({ content, isStreaming = false }: MessageContentProps) {
  const components: Components = {
    code(props) {
      const { className, children } = props
      const isInline = !className?.includes('language-')
      
      if (isInline) {
        return <TypographyInlineCode className={className}>{children}</TypographyInlineCode>
      }

      return (
        <pre className="block-code relative rounded bg-muted p-4 font-mono text-sm">
          <code className={className}>{children}</code>
        </pre>
      )
    }
  }

  return (
    <div className="space-y-4">
      {content.map((item, index) => (
        <div 
          key={index} 
          className={`prose dark:prose-invert max-w-none ${isStreaming ? 'animate-pulse' : ''}`}
        >
          <ReactMarkdown components={components}>
            {item.text}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  )
}
