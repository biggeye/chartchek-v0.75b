'use client'

import { Button, Alert } from '@/components/ui'
import { Loader2, SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

// Temporary type definition for EnhancedSubmitButtonProps
interface EnhancedSubmitButtonProps {
  message: string;
  onSubmit: any;
  isLoading: boolean;
  disabled?: boolean;
  isStreaming: boolean;
  error: string | null;
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

  const [errorState, setErrorState] = useState<string | null>(error);

  // Determine button state
  const isDisabled = disabled || isLoading || !message.trim() || Boolean(errorState);
  const isProcessing = isLoading || isStreaming

  useEffect(() => {
    if (errorState && message.trim()) {
      setErrorState(null);
    }
  }, [message, errorState]);

  // Display error alert if there's an error
  const renderErrorAlert = () => {
    if (Boolean(errorState)) {
      return <Alert variant="error">{errorState}</Alert>;
    }
    return null;
  };
  const getButtonContent = () => {
    if (Boolean(errorState)) {
      return 'Error';
    }
    if (isProcessing) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {isStreaming ? 'Processing' : 'Sending'}
        </>
      );
    }
    return (
      <>
        <SendHorizontal className="h-4 w-4 mr-2" />
        Send
      </>
    );
  };

  // Get button variant based on state
  const getButtonVariant = () => {
    if (Boolean(errorState)) return 'destructive';
    if (isProcessing) return 'secondary';
    return 'default';
  };

  return (
    {renderErrorAlert()}
    <Button
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
    </Button>
  )
}
