import { KipuCredentials, KipuApiResponse, PatientVitalSign } from '@/types/chartChek/kipuAdapter';
import { kipuServerGet } from '../auth/server';
import { parsePatientId } from '../auth/config';

/**
 * KIPU Vital Signs Response interface
 */
export interface KipuVitalSignsResponse {
  vital_signs: PatientVitalSign[];
  pagination: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
}

/**
 * Retrieves vital signs for a patient from the KIPU API
 * 
 * @param patientId - The composite ID of the patient (format: chartId:patientMasterId)
 * @param credentials - KIPU API credentials
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of results per page (default: 20)
 * @returns Promise resolving to the API response with vital signs data
 */
export async function kipuGetPatientVitalSigns(
  patientId: string,
  credentials: KipuCredentials,
  page: number = 1,
  limit: number = 20
): Promise<KipuApiResponse<KipuVitalSignsResponse>> {
  try {
    const { chartId, patientMasterId } = parsePatientId(patientId);
    
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
      page: page.toString(),
      limit: limit.toString()
    });

    const endpoint = `/api/patients/${chartId}/vital_signs?${queryParams.toString()}`;
    
    console.log(`KIPU API - Fetching vital signs for patient with chartId=${chartId}, patientMasterId=${patientMasterId}`);
    
    return await kipuServerGet<KipuVitalSignsResponse>(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientVitalSigns for patient ${patientId}:`, error);
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
 * Alias for kipuGetPatientVitalSigns for consistency with other service functions
 */
export const getPatientVitalSigns = kipuGetPatientVitalSigns;
