import { KipuCredentials, KipuApiResponse, KipuPatientOrdersResponse, KipuEvaluation } from '@/types/kipu';
import { kipuServerGet, kipuServerPost } from '../auth/server';
import { parsePatientId } from '../auth/config';

export async function kipuGetPatient<T>(
  patientId: string,
  credentials: KipuCredentials,
  options: {
    phiLevel?: 'high' | 'medium' | 'low';
    insuranceDetail?: 'v121';
    demographicsDetail?: 'v121';
    patientStatusDetail?: 'v121';
    patientContactsDetail?: boolean;
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    const { chartId, patientMasterId } = parsePatientId(patientId);
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
      phi_level: options.phiLevel || 'high'
    });

    // Add optional parameters if provided
    if (options.insuranceDetail) {
      queryParams.append('insurance_detail', options.insuranceDetail);
    }

    if (options.demographicsDetail) {
      queryParams.append('demographics_detail', options.demographicsDetail);
    }

    if (options.patientStatusDetail) {
      queryParams.append('patient_status_detail', options.patientStatusDetail);
    }

    if (options.patientContactsDetail) {
      queryParams.append('patient_contacts_detail', options.patientContactsDetail.toString());
    }

    const endpoint = `/api/patients/${chartId}?${queryParams.toString()}`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatient for patient ${patientId}`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

/**
 * Retrieves a list of patients from the KIPU API
 * @param credentials - KIPU API credentials
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of results per page (default: 20)
 * @param status - Patient status filter (default: 'active')
 * @returns Promise resolving to the API response
 */
export async function kipuGetPatients<T>(
  credentials: KipuCredentials,
  page = 1,
  limit = 20,
  status = 'active'
): Promise<KipuApiResponse<T>> {
  try {
    // Build the query string with required parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      page: page.toString(),
      limit: limit.toString(),
      status,
      phi_level: 'high'
    }).toString();

    const endpoint = `/api/patients?${queryParams}`;

    // Use kipuServerGet directly as in the API route
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatients:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
    };
  }
}

/**
 * Memoization cache for getPatient function to reduce duplicate API calls
 */
const patientCache: Record<string, any> = {};

/**
 * Memoized function to get a patient by ID
 * @param patientId - The ID of the patient
 * @returns Promise resolving to the patient data
 */
export const memoizedGetPatient = async (patientId: string): Promise<any> => {
  const cacheKey = `patient_${patientId}`;

  // Check if we have this patient in the cache
  if (patientCache[cacheKey]) {
    return patientCache[cacheKey];
  }

  try {
    // Fetch the patient from the API
    const response = await fetch(`/api/kipu/patients/${patientId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result
    patientCache[cacheKey] = data.data;

    return data.data;
  } catch (error) {
    console.error(`Error fetching patient ${patientId}:`, error);
    return null;
  }
};

/**
 * Clears the patient cache
 * @param patientId - Optional patient ID to clear specific cache entry
 */
export const clearPatientCache = (patientId?: string): void => {
  if (patientId) {
    // Clear cache for specific patient
    Object.keys(patientCache).forEach(key => {
      if (key.includes(`patient_${patientId}`)) {
        delete patientCache[key];
      }
    });
  } else {
    // Clear all patient cache
    Object.keys(patientCache).forEach(key => {
      delete patientCache[key];
    });
  }
};