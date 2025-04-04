// utils/ai/gemini/server.ts
import { getGoogleAccessToken } from '@/lib/google/getAccessToken';

export function getGeminiConfig() {
    return {
        apiKey: process.env.GOOGLE_API_KEY,
        // For OAuth authentication (optional)
        async getAccessToken() {
            try {
                return await getGoogleAccessToken();
            } catch (error) {
                console.error('Failed to get Google access token:', error);
                return null;
            }
        }
    };
}

export function getGeminiClient() {
    const config = getGeminiConfig();
    return config;
}