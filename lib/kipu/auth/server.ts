/**
 * KIPU API Authentication Utilities
 * 
 * This module provides utilities for authenticating with the KIPU API.
 * It can be used in both client and server components.
 */

import { KipuCredentials, KipuApiResponse } from '@/types/kipu';
import { getKipuCredentials, validateKipuCredentials } from './config';
import { generateKipuAuthHeaders } from './signature';
import crypto from 'crypto';

// Flag to indicate if we're running on the server
const isServer = typeof window === 'undefined';

/**
 * Interface for KIPU signature generation parameters
 */
interface KipuSignatureParams {
  method: 'GET' | 'POST';
  url: string;
  date: string;
  accessId: string;
  secretKey: string;
  contentType?: string;
  contentMD5?: string;
}

/**
 * Builds a KIPU API signature using HMAC SHA-1
 * 
 * @param params - Parameters for signature generation
 * @returns HMAC SHA-1 signature for KIPU API authentication
 */
export function buildKipuSignature(params: KipuSignatureParams): string {
  const { method, url, date, accessId, secretKey, contentType = '', contentMD5 = '' } = params;
  
  // Build the canonical string for signature generation
  // For GET requests: ,,<url>,<date>
  // For POST requests: <contentType>,<contentMD5>,<url>,<date>
  let canonicalString = '';
  
  if (method === 'GET') {
    canonicalString = `,,${url},${date}`;
  } else if (method === 'POST') {
    canonicalString = `${contentType},${contentMD5},${url},${date}`;
  }
  
  // Generate the HMAC SHA-1 signature
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(canonicalString);
  const signature = hmac.digest('base64');
  
  return signature;
}

/**
 * Makes a GET request to the KIPU API
 * @param endpoint - API endpoint (without base URL)
 * @param customCredentials - Optional custom credentials (defaults to environment variables)
 * @returns Promise resolving to the API response
 */
export async function kipuServerGet<T>(
  endpoint: string,
  customCredentials?: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    const credentials = customCredentials || getKipuCredentials();
    
    if (!validateKipuCredentials()) {
      throw new Error('KIPU API credentials are missing or invalid');
    }
    
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Add app_id parameter to the endpoint if it doesn't already have it
    const separator = formattedEndpoint.includes('?') ? '&' : '?';
    const endpointWithAppId = formattedEndpoint.includes('app_id=') 
      ? formattedEndpoint 
      : `${formattedEndpoint}${separator}app_id=${credentials.appId}`;
    
    // Generate authentication headers
    const headers = generateKipuAuthHeaders('GET', endpointWithAppId, credentials);
    
    // Log request details for debugging (with masked credentials)
    console.log(`KIPU API Request: ${credentials.baseUrl}${endpointWithAppId}`);
    
    // Make the request
    const response = await fetch(`${credentials.baseUrl}${endpointWithAppId}`, {
      method: 'GET',
      headers,
    });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`KIPU API error (${response.status}):`, errorText);
      
      let errorMessage = `KIPU API error: ${response.statusText}`;
      let errorDetails = undefined;
      
      try {
        // Try to parse error as JSON if possible
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
        errorDetails = errorJson;
      } catch (e) {
        // If not JSON, use the raw text
        errorDetails = { raw: errorText };
      }
      
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: errorMessage,
          details: errorDetails
        }
      };
    }
    
    // Check content type to ensure it's JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('KIPU API returned non-JSON response:', text);
      
      return {
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: `Expected JSON but got ${contentType || 'unknown content type'}`,
          details: { raw: text }
        }
      };
    }
    
    // Parse the response
    try {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
      
      // Try to get the raw text to help with debugging
      let rawText = '';
      try {
        rawText = await response.text();
      } catch (e) {
        rawText = 'Could not retrieve raw response text';
      }
      
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Failed to parse KIPU API response as JSON',
          details: { error: parseError instanceof Error ? parseError.message : String(parseError), raw: rawText }
        }
      };
    }
  } catch (error) {
    console.error('Error in kipuServerGet:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error in kipuServerGet',
        details: error
      }
    };
  }
}

/**
 * Makes a POST request to the KIPU API
 * @param endpoint - API endpoint (without base URL)
 * @param body - Request body
 * @param customCredentials - Optional custom credentials (defaults to environment variables)
 * @returns Promise resolving to the API response
 */
export async function kipuServerPost<T>(
  endpoint: string,
  body: any,
  customCredentials?: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    const credentials = customCredentials || getKipuCredentials();
    
    if (!validateKipuCredentials()) {
      throw new Error('KIPU API credentials are missing or invalid');
    }
    
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Add app_id parameter to the endpoint if it doesn't already have it
    const separator = formattedEndpoint.includes('?') ? '&' : '?';
    const endpointWithAppId = formattedEndpoint.includes('app_id=') 
      ? formattedEndpoint 
      : `${formattedEndpoint}${separator}app_id=${credentials.appId}`;
    
    // Convert body to JSON string
    const bodyString = JSON.stringify(body);
    
    // Generate authentication headers with body content
    const headers = generateKipuAuthHeaders('POST', endpointWithAppId, credentials, bodyString);
    
    // Add content-type header
    headers['Content-Type'] = 'application/json';
    
    // Make the request
    const response = await fetch(`${credentials.baseUrl}${endpointWithAppId}`, {
      method: 'POST',
      headers,
      body: bodyString
    });
    
    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: data.message || response.statusText,
          details: data
        }
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error in kipuServerPost:', error);
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error in kipuServerPost',
        details: error
      }
    };
  }
}
