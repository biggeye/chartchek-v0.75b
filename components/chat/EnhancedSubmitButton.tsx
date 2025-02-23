'use client';

import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Loader2, SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface EnhancedSubmitButtonProps {
  message: string;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
  isStreaming: boolean;
  error: string | null;
  assistantId: string;
  threadId: string;
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

  const isDisabled = disabled || isLoading || !message.trim() || Boolean(errorState);
  const isProcessing = isLoading || isStreaming;

  useEffect(() => {
    if (errorState && message.trim()) {
      setErrorState(null);
    }
  }, [errorState, message]);

  const renderErrorAlert = () => {
    if (errorState) {
      return <Alert>{errorState}</Alert>;
    }
    return null;
  };

  const getButtonContent = () => {
    if (isProcessing) {
      return <Loader2 className="animate-spin" />;
    }
    return <SendHorizontal />;
  };

  const getButtonVariant = () => {
    return isDisabled ? 'disabled' : 'primary';
  };

  return (
    <>
      {renderErrorAlert()}
      <Button
        disabled={isDisabled}
        className={cn(
          "min-w-[100px] transition-all duration-200",
          {
            'opacity-50': isDisabled,
            'animate-pulse': isStreaming,
          },
          className
        )}
        onClick={onSubmit}
      >
        {getButtonContent()}
      </Button>
    </>
  );
}
