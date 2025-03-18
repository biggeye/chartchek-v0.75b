/**
 * KIPU API Configuration
 * 
 * This module provides configuration settings for the KIPU API integration.
 * It uses Supabase as the primary source for credentials with environment
 * variables as a fallback.
 */

import { KipuCredentials } from '@/types/kipu';
import { getKipuCredentialsWithFallback } from './credentials';

// Cache for credentials to avoid repeated Supabase calls
let cachedCredentials: KipuCredentials | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Gets the KIPU API credentials from Supabase or environment variables
 * @returns KIPU API credentials object
 */
export async function getKipuCredentialsAsync(): Promise<KipuCredentials> {
  const now = Date.now();
  
  // Return cached credentials if they're still valid
  if (cachedCredentials && (now - lastFetchTime < CACHE_TTL)) {
    return cachedCredentials;
  }
  
  // Fetch fresh credentials
  const credentials = await getKipuCredentialsWithFallback();
  
  // Update cache
  cachedCredentials = credentials;
  lastFetchTime = now;
  
  return credentials;
}

/**
 * Gets the KIPU API credentials synchronously (from cache or environment variables)
 * This is a fallback for contexts where async isn't possible
 * @returns KIPU API credentials object
 */
export function getKipuCredentials(): KipuCredentials {
  // If we have cached credentials, use them
  if (cachedCredentials) {
    return cachedCredentials;
  }
  
  // Otherwise fall back to environment variables
  const credentials = {
    accessId: process.env.KIPU_ACCESS_ID || '',
    secretKey: process.env.KIPU_SECRET_KEY || '',
    appId: process.env.KIPU_APP_ID || '',
    baseUrl: process.env.KIPU_BASE_URL || 'https://api.kipuapi.com'
  };
  
  // Cache these credentials
  cachedCredentials = credentials;
  lastFetchTime = Date.now();
  
  return credentials;
}

/**
 * Validates that all required KIPU credentials are present
 * @param credentials - Optional credentials to validate (uses getKipuCredentials() if not provided)
 * @returns True if all credentials are present, false otherwise
 */
export function validateKipuCredentials(credentials?: KipuCredentials): boolean {
  const creds = credentials || getKipuCredentials();
  return !!(
    creds.accessId &&
    creds.secretKey &&
    creds.appId &&
    creds.baseUrl
  );
}

/**
 * Clears the credentials cache, forcing the next call to fetch fresh credentials
 */
export function clearKipuCredentialsCache(): void {
  cachedCredentials = null;
  lastFetchTime = 0;
}
