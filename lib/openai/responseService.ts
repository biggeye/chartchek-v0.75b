// lib/openai/responseService.ts

import { OpenAIResponse, TextFormatOptions, BaseToolDefinition } from '@/types/openai/responses';

// Error interface for consistent error handling
export interface OpenAIError {
  code: string;
  message: string;
  param?: string;
  type?: string;
}

// Configuration options for creating a response
export interface CreateResponseOptions {
  model: string;
  instructions?: string;
  input: string | Array<{
    type: string;
    [key: string]: any;
  }>;
  tools?: Array<BaseToolDefinition>;
  tool_choice?:
    | 'none'
    | 'auto'
    | 'required'
    | { type: 'file_search' | 'web_search_preview' | 'computer_use_preview' }
    | { type: 'function'; name: string };
  reasoning?: {
    effort?: 'low' | 'medium' | 'high' | null;
    generate_summary?: 'concise' | 'detailed' | null;
  };
  text?: {
    format?: TextFormatOptions;
  };
  temperature?: number;
  top_p?: number;
  max_output_tokens?: number;
  metadata?: Record<string, string>;
  previous_response_id?: string;
}

// Stream event handler types
export type ResponseEventHandler = (response: OpenAIResponse) => void;
export type ErrorEventHandler = (error: OpenAIError) => void;

class OpenAIResponseService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a response from the OpenAI API
   */
  async createResponse(options: CreateResponseOptions): Promise<OpenAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          instructions: options.instructions || null,
          input: options.input,
          tools: options.tools || [],
          tool_choice: options.tool_choice || 'auto',
          reasoning: options.reasoning || null,
          text: options.text || {},
          temperature: options.temperature || null,
          top_p: options.top_p || null,
          max_output_tokens: options.max_output_tokens || null,
          metadata: options.metadata || {},
          previous_response_id: options.previous_response_id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create response');
      }

      return (await response.json()) as OpenAIResponse;
    } catch (error: any) {
      console.error('Error creating OpenAI response:', error);
      throw error;
    }
  }

  /**
   * Stream a response from the OpenAI API
   */
  streamResponse(
    options: CreateResponseOptions,
    onEvent: ResponseEventHandler,
    onError?: ErrorEventHandler
  ): () => void {
    // Create request options
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        instructions: options.instructions || null,
        input: options.input,
        tools: options.tools || [],
        tool_choice: options.tool_choice || 'auto',
        reasoning: options.reasoning || null,
        text: options.text || {},
        temperature: options.temperature || null,
        top_p: options.top_p || null,
        max_output_tokens: options.max_output_tokens || null,
        metadata: options.metadata || {},
        previous_response_id: options.previous_response_id || null,
        stream: true,
      }),
    };

    // Create EventSource for streaming
    const eventSourceUrl = new URL(`${this.baseUrl}/responses`);
    eventSourceUrl.searchParams.append('stream', 'true');

    // Use fetch with ReadableStream instead of EventSource for more control
    let controller: AbortController | null = new AbortController();

    fetch(eventSourceUrl.toString(), {
      ...requestOptions,
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processChunk() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    if (controller) controller = null;
                    return;
                  }

                  try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.response) {
                      onEvent(parsedData.response);
                    }
                  } catch (e) {
                    if (onError)
                      onError({
                        code: 'parse_error',
                        message: 'Failed to parse stream data',
                      });
                  }
                }
              }

              processChunk();
            })
            .catch((err) => {
              if (onError)
                onError({
                  code: 'stream_error',
                  message: err.message || 'Error in response stream',
                });
            });
        }

        processChunk();
      })
      .catch((err) => {
        if (onError)
          onError({
            code: 'request_error',
            message: err.message || 'Failed to initiate stream',
          });
      });

    // Return a function to abort the stream
    return () => {
      if (controller) {
        controller.abort();
        controller = null;
      }
    };
  }

  /**
   * Get a response by ID
   */
  async getResponse(responseId: string): Promise<OpenAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/responses/${responseId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response');
      }

      return (await response.json()) as OpenAIResponse;
    } catch (error: any) {
      console.error('Error getting OpenAI response:', error);
      throw error;
    }
  }
}

// Create a singleton instance with API key from environment
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
export const openAIResponseService = new OpenAIResponseService(apiKey);

export default openAIResponseService;