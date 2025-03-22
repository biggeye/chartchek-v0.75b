import { KipuCredentials, KipuApiResponse, KipuPatientOrdersResponse, KipuEvaluation } from '@/types/kipu';
import { kipuServerGet, kipuServerPost } from '../auth/server';
import { parsePatientId } from '../auth/config';
/**
 * Retrieves a patient from the KIPU API by ID
 * @param patientId - The composite ID of the patient (format: locationPatientId:patientMasterId)
 * @param facilityId - The facility/location ID where the patient is located
 * @param credentials - KIPU API credentials
 * @param options - Additional options for the request
 * @returns Promise resolving to the API response
 */
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
    const { locationPatientId, patientMasterId } = parsePatientId(patientId);
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

    const endpoint = `/api/patients/${locationPatientId}?${queryParams.toString()}`;

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
 * @param facilityId - The ID of the facility to retrieve patients for
 * @param credentials - KIPU API credentials
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of results per page (default: 20)
 * @param status - Patient status filter (default: 'active')
 * @returns Promise resolving to the API response
 */
export async function kipuGetPatients<T>(
  facilityId: string | number,
  credentials: KipuCredentials,
  page = 1,
  limit = 20,
  status = 'active'
): Promise<KipuApiResponse<T>> {
  try {
    // Build the query string with required parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      facility_id: facilityId.toString(),
      page: page.toString(),
      limit: limit.toString(),
      status,
      phi_level: 'high'
    }).toString();

    const endpoint = `/api/patients?${queryParams}`;

    // Use kipuServerGet directly as in the API route
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatients for facility ${facilityId}:`, error);
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
 * Retrieves evaluations for a patient from the KIPU API
 * @param patientId - The casefile ID of the patient
 * @param credentials - KIPU API credentials
 * @param options - Additional options for the request
 * @returns Promise resolving to the API response
 */
export async function kipuGetPatientEvaluations<T>(
  patientId: string,
  credentials: KipuCredentials,
  options: {
    evaluationId?: number;
    completedOnly?: boolean;
    currentCensusOnly?: boolean;
    startDate?: string;
    endDate?: string;
    includeStranded?: boolean;
    page?: number;
    per?: number;
    patientProcessId?: number;
    evaluationContent?: 'standard' | 'notes' | 'treatment_plan';
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    const { patientMasterId, locationPatientId } = parsePatientId(patientId);

    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId
    });

    // Add optional parameters if provided
    if (options.evaluationId) queryParams.append('evaluation_id', options.evaluationId.toString());
    if (options.completedOnly !== undefined) queryParams.append('completed_only', options.completedOnly.toString());
    if (options.currentCensusOnly !== undefined) queryParams.append('current_census_only', options.currentCensusOnly.toString());
    if (options.startDate) queryParams.append('start_date', options.startDate);
    if (options.endDate) queryParams.append('end_date', options.endDate);
    if (options.includeStranded !== undefined) queryParams.append('include_stranded', options.includeStranded.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.per) queryParams.append('per', options.per.toString());
    if (options.patientProcessId) queryParams.append('patient_process_id', options.patientProcessId.toString());
    if (options.evaluationContent) queryParams.append('evaluation_content', options.evaluationContent);

    const endpoint = `/api/patients/${locationPatientId}/patient_evaluations?${queryParams.toString()}`;

    // Use kipuServerGet directly as in the API route
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientEvaluations for patient ${patientId}:`, error);
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
 * Retrieves a specific evaluation from the KIPU API
 * @param evaluationId - The ID of the evaluation to retrieve
 * @param credentials - KIPU API credentials
 * @param includeSettings - Whether to include more details of the patient evaluation
 * @returns Promise resolving to the API response
 */
export async function kipuGetEvaluation<T>(
  evaluationId: string,
  credentials: KipuCredentials,
  includeSettings = false
): Promise<KipuApiResponse<T>> {
  try {

    // Ensure the evaluation ID is properly encoded for the URL
    const encodedEvaluationId = encodeURIComponent(evaluationId);

    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId
    });

    // Add optional parameters
    if (includeSettings) {
      queryParams.append('include_settings', 'true');
    }

    const endpoint = `/api/patient_evaluations/${encodedEvaluationId}?${queryParams.toString()}`;
console.log(`[patient-service] endpoint: ${endpoint}`);
    // Use kipuServerGet directly as in the API route
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetEvaluation for evaluation ${evaluationId}:`, error);
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
/*
/**
 * Retrieves all appointments scoped to a specific patient
 * @param patientId - The ID of the patient
 * @param credentials - KIPU API credentials
 * @param options - Optional parameters for pagination
 * @returns Promise resolving to the API response
 */
export async function kipuGetAppointments<T>(
  patientId: string,
  credentials: KipuCredentials,
  options: {
    page?: number;
    per?: number;
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    const { locationPatientId } = parsePatientId(patientId);
    
    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
    });
    
    // Add optional parameters
    if (options.page) {
      queryParams.append('page', options.page.toString());
    }
    if (options.per) {
      queryParams.append('per', options.per.toString());
    }
    
    console.log(`Making KIPU API call to get appointments for patient ${patientId}`);
    
    // Make the request to KIPU API
    const endpoint = `/api/patients/${locationPatientId}/appointments?${queryParams.toString()}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetAppointments for patient ${patientId}:`, error);
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
 * Retrieves a specific appointment
 * @param patientId - The ID of the patient
 * @param appointmentId - The ID of the appointment
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the API response
 */
export async function kipuGetAppointment<T>(
  patientId: string,
  appointmentId: string | number,
  credentials: KipuCredentials
): Promise<KipuApiResponse<T>> {
  try {
    const { locationPatientId } = parsePatientId(patientId);
    
    console.log(`Making KIPU API call to get appointment ${appointmentId} for patient ${patientId}`);
    
    const endpoint = `/api/patients/${locationPatientId}/appointments/${appointmentId}?app_id=${credentials.appId}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetAppointment for patient ${patientId}, appointment ${appointmentId}:`, error);
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
 * Retrieves all appointments scoped to a specific patient 
 *  */
export async function kipuGetPatientAppointments<T>(
  patientId: string,
  credentials: KipuCredentials,
  options: {
    startDate?: string;
    endDate?: string;
    page?: number;
    per?: number;
  } = {}
): Promise<KipuApiResponse<T>> {
  try {
    // Set default values
    const { startDate, endDate, page = 1, per = 20 } = options;
    const { patientMasterId, locationPatientId } = parsePatientId(patientId);

    // Build the query parameters
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId,
    });
    // Add optional parameters
    if (options.startDate) {
      queryParams.append('start_date', options.startDate);
    }
    if (options.endDate) {
      queryParams.append('end_date', options.endDate);
    }
    if (options.page) {
      queryParams.append('page', options.page.toString());
    }
    if (options.per) {
      queryParams.append('per', options.per.toString());
    }

    // Make the request to KIPU API
    const endpoint = `/api/patients/${locationPatientId}/appointments?${queryParams.toString()}`;
    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetAppointments for patient ${patientId}:`, error);
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
/*
 * Retrieves vital signs for a patient from the KIPU API
 */
export async function kipuGetPatientVitalSigns(
  patientId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    console.log(`Making KIPU API call to get vital signs for patient ${patientId}`);

    const endpoint = `/api/patients/${patientId}/vital_signs?app_id=${credentials.appId}&phi_level=high`;

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientVitalSigns for patient ${patientId}:`, error);
    return {
      success: false,
      error: {
        code: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
/**
 * Retrieves medication orders for a patient from the KIPU API
 * @param patientId - The ID of the patient
 * @param locationId - The ID of the location
 * @param credentials - KIPU API credentials
 * @param queryParams - Additional query parameters
 * @returns Promise resolving to the API response
 */
export async function kipuGetPatientMedicationOrders<T>(
  patientId: string,
  facilityId: string | number,
  credentials: KipuCredentials,
  queryParams: Record<string, string | number | boolean | undefined> = {}
): Promise<KipuApiResponse<T>> {
  try {
    console.log(`Making KIPU API call to get medication orders for patient ${patientId} in facility ${facilityId}`);

    // Decode the patient ID first in case it's already URL-encoded
    const decodedPatientId = decodeURIComponent(patientId);

    // Add detailed logging about the patient ID format
    const patientIdParts = decodedPatientId.split(':');
    console.log(`Patient ID format analysis: Parts=${patientIdParts.length}, Format=${patientIdParts.length === 2 ? 'Valid (number:uuid)' : 'Invalid'}`);

    // According to KIPU API documentation:
    // - The path parameter should be the Location Patient ID (an integer)
    // - The query parameter patient_master_id should be the Patient Master UUID
    let locationPatientId: string;
    let patientMasterId: string;

    if (patientIdParts.length === 2) {
      console.log(`Patient ID components: Numeric part=${patientIdParts[0]}, UUID part=${patientIdParts[1]}`);
      locationPatientId = patientIdParts[0];
      patientMasterId = patientIdParts[1];
    } else {
      console.log(`Patient ID format is not as expected. Using the whole ID for both parameters.`);
      locationPatientId = decodedPatientId;
      patientMasterId = decodedPatientId;
    }

    // Then properly encode it for the URL
    const encodedLocationPatientId = encodeURIComponent(locationPatientId);
    console.log(`Patient ID: Original=${patientId}, Decoded=${decodedPatientId}, Encoded Location Patient ID=${encodedLocationPatientId}`);

    // Create the base query parameters
    const baseParams = new URLSearchParams({
      app_id: credentials.appId,
      patient_master_id: patientMasterId
    });

    // Add all additional query parameters
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        baseParams.append(key, value.toString());
      }
    }

    const endpoint = `/api/patients/${encodedLocationPatientId}/patient_orders?${baseParams.toString()}`;

    // Log the endpoint (masking sensitive parts)
    console.log(`KIPU API endpoint: /api/patients/${encodedLocationPatientId}/patient_orders?app_id=***`);

    return await kipuServerGet(endpoint, credentials);
  } catch (error) {
    console.error(`Error in kipuGetPatientMedicationOrders for patient ${patientId} in facility ${facilityId}:`, error);
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
export async function getFacilityData(facilityId: string): Promise<any> {
  try {
    // Get patients for the facility
    const patientsResponse = await fetch(`/api/kipu/facilities/${facilityId}/patients?limit=100`);
    if (!patientsResponse.ok) {
      throw new Error(`Failed to fetch patients: ${patientsResponse.status} ${patientsResponse.statusText}`);
    }
    const patientsData = await patientsResponse.json();

    // Return combined data
    return {
      data: {
        patients: patientsData.data || []
      },
      success: true
    };
  } catch (error) {
    console.error(`Error fetching facility data for facility ${facilityId}:`, error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
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
 * @param facilityId - The ID of the facility
 * @returns Promise resolving to the patient data
 */
export const memoizedGetPatient = async (patientId: string, facilityId: number): Promise<any> => {
  const cacheKey = `patient_${patientId}_${facilityId}`;

  // Check if we have this patient in the cache
  if (patientCache[cacheKey]) {
    return patientCache[cacheKey];
  }

  try {
    // Fetch the patient from the API
    const response = await fetch(`/api/kipu/patients/${patientId}?facilityId=${facilityId}`);
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