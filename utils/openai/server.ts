import OpenAI from 'openai';

// Server-side OpenAI client - only use this in API routes or server components
let openaiInstance: OpenAI | null = null;

// Default assistant ID for development
export const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export function getOpenAIClient() {
  if (!openaiInstance) {
    // Use OPENAI_API_KEY (server-side) instead of NEXT_PUBLIC_OPENAI_API_KEY
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openaiInstance;
}
