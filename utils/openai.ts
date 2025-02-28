'use server';

import OpenAI from "openai"

export const openai = async () => new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
}); 

