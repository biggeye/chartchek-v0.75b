import { type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'
import type { Message, MessageContent } from '@/types/api/openai'

export interface RunStatusProps {
  isStreaming?: boolean
  error?: string
  assistantId?: string
  threadId?: string
  className?: string
}

export interface SubmitButtonProps {
  message: string
  isLoading: boolean
}

export interface EnhancedSubmitButtonProps extends Omit<ComponentProps<typeof SubmitButton>, 'children' | 'pendingText'> {
  message: string
  isLoading: boolean
  isStreaming?: boolean
  error?: string
  assistantId?: string
  threadId?: string
  className?: string
}

export interface FileUploadProps {
  threadId: string;
  onFileUpload: (file: File) => void;
  isAttachment: boolean;
}

export interface MessageListProps {
  messages: Message[]
  streamingContent?: MessageContent[]
}

export interface MessageContentProps {
  content: MessageContent
  className?: string
}

export interface NewThreadButtonProps {
  onNewThread: (assistantId: string) => void
  className?: string
}
