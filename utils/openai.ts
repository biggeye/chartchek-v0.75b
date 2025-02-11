'use server'
import OpenAI from "openai"

export const openai = async () => await new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  defaultHeaders: {
    "OpenAI-Beta": "assistants=v2"
  }
});