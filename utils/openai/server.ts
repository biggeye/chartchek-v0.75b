import OpenAI from 'openai';

// Server-side OpenAI client - only use this in API routes or server components
let openaiInstance: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not defined');
    }
    
    openaiInstance = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });
  }
  
  return openaiInstance;
}
