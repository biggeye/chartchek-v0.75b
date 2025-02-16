'use client'

import { SubmitButton } from '@/components/submit-button'
import { Loader2, SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

// Temporary type definition for EnhancedSubmitButtonProps
interface EnhancedSubmitButtonProps {
  message: string;
  onSubmit: any;
  isLoading: boolean;
  disabled?: boolean;
  isStreaming: boolean;
  error: any;
  assistantId: any;
  threadId: any;
  className: string;
}

export function EnhancedSubmitButton({ 
  message, 
  onSubmit, 
  isLoading, 
  disabled = false,
  isStreaming,
  error,
  assistantId,
  threadId,
  className,
}: EnhancedSubmitButtonProps) {

  // Determine button state
  const isDisabled = isLoading || !message.trim()
  const isProcessing = isLoading || isStreaming

  // Get button content based on state
  const getButtonContent = () => {
    if (error) {
      return 'Error'
    }
    if (isProcessing) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {isStreaming ? 'Processing' : 'Sending'}
        </>
      )
    }
    return (
      <>
        <SendHorizontal className="h-4 w-4 mr-2" />
        Send
      </>
    )
  }

  // Get button variant based on state
  const getButtonVariant = () => {
    if (error) return 'destructive'
    if (isProcessing) return 'secondary'
    return 'default'
  }

  return (
    <SubmitButton
      disabled={isDisabled}
      variant={getButtonVariant()}
      className={cn(
        "min-w-[100px] transition-all duration-200",
        {
          'opacity-50': isDisabled,
          'animate-pulse': isStreaming,
        },
        className
      )}
    >
      {getButtonContent()}
    </SubmitButton>
  )
}
