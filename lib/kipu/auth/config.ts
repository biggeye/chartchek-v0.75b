import { createClient } from '@/utils/supabase/client';
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

/**
 * Parses a composite patient ID into its components
 * @param patientId - The composite patient ID in format "chartId:patientMasterId"
 * @returns An object containing the chartId and patientMasterId
 */
export function parsePatientId(patientId: string): { chartId: string; patientMasterId: string } {
  if (!patientId) return { chartId: '', patientMasterId: '' };
  
  // Decode the patient ID first in case it's already URL-encoded
  const decodedPatientId = decodeURIComponent(patientId);
  
  // Split the patient ID into its components
  const patientIdParts = decodedPatientId.split(':');
  
  if (patientIdParts.length === 2) {
      return {
      chartId: patientIdParts[0],
      patientMasterId: patientIdParts[1]
    };
  } else {
    // If the format is not as expected, use the whole ID for both
    console.log(`Patient ID format is not as expected. Using the whole ID for both components.`);
    return {
      chartId: decodedPatientId,
      patientMasterId: decodedPatientId
    };
  }
}

const API_SETTINGS_TABLE = 'user_api_settings';

export async function loadKipuCredentialsFromSupabase(): Promise<KipuCredentials | null> {
  try {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();
    const userId = user?.user?.id;
    if (!userId) {
      console.warn('Failed to load KIPU credentials from Supabase: User not authenticated');
      return null;
    }
    // Query the api_settings table for KIPU credentials
    const { data, error } = await supabase
      .from('user_api_settings')
      .select('*')
      .eq('owner_id', userId)
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
    const supabase = await createClient();
    
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
 * Validates that all required KIPU credentials are present
 * @param credentials - Optional credentials to validate (uses getKipuCredentials() if not provided)
 * @returns True if all credentials are present, false otherwise
 */
export async function validateKipuCredentials(credentials?: KipuCredentials): Promise<boolean> {
  const creds = credentials || await loadKipuCredentialsFromSupabase();
  
  if (!creds) return false;
  
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
