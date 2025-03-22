/**
 * KIPU API Credentials Manager
 * 
 * This module provides utilities for loading and storing KIPU API credentials
 * from Supabase, with a fallback to local environment variables.
 */

import { createClient } from '@/utils/supabase/client';
import { KipuCredentials } from '@/types/kipu';

// Table name for API settings in Supabase
const API_SETTINGS_TABLE = 'user_api_settings';

/**
 * Creates a Supabase client for server-side operations
 * @returns Supabase client
 */
function createSupabaseClient() {
  // Use direct client creation for server-side operations
  return createClient();
}

/**
 * Loads KIPU API credentials from Supabase
 * @returns Promise resolving to KIPU API credentials
 */
export async function loadKipuCredentialsFromSupabase(): Promise<KipuCredentials | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Query the api_settings table for KIPU credentials
    const { data, error } = await supabase
      .from(API_SETTINGS_TABLE)
      .select('*')
      .eq('api_name', 'kipu')
      .single();
    
    if (error || !data) {
      console.warn('Failed to load KIPU credentials from Supabase:', error?.message);
      return null;
    }
    
    // Map the database fields to our credentials interface
    return {
      accessId: data.access_id || '',
      secretKey: data.secret_key || '',
      appId: data.app_id || '',
      baseUrl: data.base_url || 'https://api.kipuapi.com'
    };
  } catch (error) {
    console.error('Error loading KIPU credentials from Supabase:', error);
    return null;
  }
}

/**
 * Saves KIPU API credentials to Supabase
 * @param credentials - KIPU API credentials to save
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function saveKipuCredentialsToSupabase(credentials: KipuCredentials): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    // Check if a record already exists
    const { data: existingData } = await supabase
      .from(API_SETTINGS_TABLE)
      .select('id')
      .eq('api_name', 'kipu')
      .single();
    
    const credentialsRecord = {
      api_name: 'kipu',
      access_id: credentials.accessId,
      secret_key: credentials.secretKey,
      app_id: credentials.appId,
      base_url: credentials.baseUrl,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existingData) {
      // Update existing record
      result = await supabase
        .from(API_SETTINGS_TABLE)
        .update(credentialsRecord)
        .eq('id', existingData.id);
    } else {
      // Insert new record
      result = await supabase
        .from(API_SETTINGS_TABLE)
        .insert({
          ...credentialsRecord,
          created_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Failed to save KIPU credentials to Supabase:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving KIPU credentials to Supabase:', error);
    return false;
  }
}

/**
 * Gets KIPU API credentials with Supabase as primary source and environment variables as fallback
 * @returns Promise resolving to KIPU API credentials
 */
export async function getKipuCredentialsWithFallback(): Promise<KipuCredentials> {
  // Try to load from Supabase first
  const supabaseCredentials = await loadKipuCredentialsFromSupabase();
  
  if (supabaseCredentials && 
      supabaseCredentials.accessId && 
      supabaseCredentials.secretKey && 
      supabaseCredentials.appId) {
    return supabaseCredentials;
  }
  
  // Fall back to environment variables
  return {
    accessId: process.env.KIPU_ACCESS_ID || '',
    secretKey: process.env.KIPU_SECRET_KEY || '',
    appId: process.env.KIPU_APP_ID || '',
    baseUrl: process.env.KIPU_BASE_URL || 'https://api.kipuapi.com'
  };
}
