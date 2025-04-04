// lib/ai/provider.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { AIProvider, ProviderType } from './types';
import { getOpenAIConfig } from '@/utils/ai/openai/server';
import { getAnthropicConfig } from '@/utils/ai/anthropic/server';
import { getGeminiConfig } from '@/utils/ai/gemini/server';
import { getGroqConfig } from '@/utils/ai/groq/server';

export function createAIProvider(type: ProviderType): AIProvider {
    switch (type) {
        case 'openai':
            return new OpenAI(getOpenAIConfig());
        case 'anthropic':
            return new Anthropic(getAnthropicConfig());
        case 'gemini':
            return new GoogleAI(getGeminiConfig());
        case 'groq':
            return new Groq(getGroqConfig());
        default:
            throw new Error(`Unsupported AI provider type: ${type}`);
    }
}