// hooks/useOpenAIResponse.ts

import { useState, useEffect, useCallback } from 'react';
import openAIResponseService, { CreateResponseOptions } from '@/lib/ai/openai/responseService';
import { OpenAIResponse, OpenAIError } from '@/types/chatChek/openAiAdapter';

interface UseOpenAIResponseProps {
  initialOptions?: Partial<CreateResponseOptions>;
}

interface UseOpenAIResponseReturn {
  response: OpenAIResponse | null;
  error: OpenAIError | null;
  loading: boolean;
  streaming: boolean;
  createResponse: (options: CreateResponseOptions) => Promise<void>;
  streamResponse: (options: CreateResponseOptions) => void;
  stopStreaming: () => void;
}

export function useOpenAIResponse({ initialOptions = {} }: UseOpenAIResponseProps = {}): UseOpenAIResponseReturn {
  const [response, setResponse] = useState<OpenAIResponse | null>(null);
  const [error, setError] = useState<OpenAIError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [stopStreamingFn, setStopStreamingFn] = useState<(() => void) | null>(null);
  
  const createResponse = useCallback(async (options: CreateResponseOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await openAIResponseService.createResponse({
        ...initialOptions,
        ...options,
      });
      setResponse(result);
    } catch (err: any) {
      setError({
        code: 'request_error',
        message: err.message || 'Failed to create response',
      });
    } finally {
      setLoading(false);
    }
  }, [initialOptions]);
  
  const streamResponse = useCallback((options: CreateResponseOptions) => {
    setStreaming(true);
    setError(null);
    
    const stopFn = openAIResponseService.streamResponse(
      {
        ...initialOptions,
        ...options,
      },
      (streamedResponse) => {
        setResponse(streamedResponse);
      },
      (streamError) => {
        setError(streamError);
        setStreaming(false);
      }
    );
    
    setStopStreamingFn(() => stopFn);
  }, [initialOptions]);
  
  const stopStreaming = useCallback(() => {
    if (stopStreamingFn) {
      stopStreamingFn();
      setStopStreamingFn(null);
      setStreaming(false);
    }
  }, [stopStreamingFn]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stopStreamingFn) {
        stopStreamingFn();
      }
    };
  }, [stopStreamingFn]);
  
  return {
    response,
    error,
    loading,
    streaming,
    createResponse,
    streamResponse,
    stopStreaming,
  };
}