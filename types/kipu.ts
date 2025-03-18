/**
 * KIPU API Type Definitions
 * 
 * This file contains TypeScript interfaces for the KIPU API integration.
 */

/**
 * KIPU API Credentials
 */
export interface KipuCredentials {
  accessId: string;
  secretKey: string;
  appId: string; // Also referred to as recipient_id
  baseUrl: string;
  apiEndpoint?: string; // For direct API calls
}

/**
 * KIPU API Response
 */
export interface KipuApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * KIPU Patient
 */
export interface KipuPatient {
  id: string;
  mrn?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  status?: string;
  admission_date?: string;
  discharge_date?: string;
  facility_id?: string;
  // Add more fields as needed based on the API documentation
}

/**
 * KIPU Facility
 */
export interface KipuFacility {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  // Add more fields as needed based on the API documentation
}

/**
 * KIPU Patient Evaluation
 */
export interface KipuPatientEvaluation {
  id: string;
  patient_id: string;
  facility_id?: string;
  evaluation_type: string;
  evaluation_date: string;
  status: string;
  completed_by?: string;
  content?: Record<string, any>;
  // Add more fields as needed based on the API documentation
}

/**
 * KIPU Document
 */
export interface KipuDocument {
  id: string;
  patient_id: string;
  facility_id?: string;
  document_type: string;
  created_date: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  url?: string;
  // Add more fields as needed based on the API documentation
}

/**
 * Facility API Settings
 * 
 * Represents the API settings for a facility, including credentials for KIPU integration.
 * Corresponds to the facility_api_settings table in Supabase.
 */
export interface FacilityApiSettings {
  id?: number | string;
  facility_id: string;
  kipu_access_id?: string;  // KIPU API access ID for HMAC authentication
  kipu_secret_key?: string; // KIPU API secret key for HMAC authentication
  kipu_app_id?: string;     // KIPU API app ID (recipient_id)
  kipu_base_url?: string;   // KIPU API base URL
  has_api_key_configured: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Simplified Facility API Settings for UI display
 * 
 * A subset of FacilityApiSettings used for display in the UI
 */
export interface FacilityApiSettingsDisplay {
  has_api_key_configured: boolean;
  updated_at?: string;
}

/**
 * Facility (corresponds to KIPU Location)
 */
export interface Facility {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  buildings?: Building[];
  data?: FacilityData;
  api_settings?: FacilityApiSettingsDisplay;
}

/**
 * Building within a Facility
 */
export interface Building {
  id: string;
  name: string;
  code?: string;
  address?: string;
  status?: 'active' | 'inactive';
  facility_id: string;
}

/**
 * Additional data associated with a Facility
 */
export interface FacilityData {
  beds?: {
    total: number;
    available: number;
    occupied: number;
  };
  staff?: {
    total: number;
    active: number;
  };
  patients?: {
    total: number;
    admitted: number;
    discharged: number;
  };
  insights?: {
    occupancy_rate?: number;
    avg_length_of_stay?: number;
    readmission_rate?: number;
    [key: string]: any;
  };
  metrics?: Record<string, any>;
}
