// types/ai/index.ts
export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ThreadOptions {
  metadata?: Record<string, any>;
}

export interface AIProvider {
  // Thread management
  createThread(options?: ThreadOptions): Promise<string>;
  getThread(threadId: string): Promise<any>;
  
  // Message handling
  addMessage(threadId: string, message: Message): Promise<string>;
  getMessages(threadId: string): Promise<Message[]>;
  
  // Generation
  generateResponse(threadId: string, options?: any): Promise<{
    messageId: string;
    content: string;
  }>;
  
  // Streaming
  streamResponse(threadId: string, options?: any): AsyncIterable<{
    type: 'content' | 'error';
    data: any;
  }>;
}