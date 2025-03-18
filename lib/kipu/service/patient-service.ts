/**
 * Patient Service
 * 
 * This service handles interactions with the KIPU API for patient-related operations.
 * It provides functions for listing patients, getting patient details, and retrieving patient evaluations.
 */

import { PatientBasicInfo, PatientEvaluation, KipuEvaluation, PatientEvaluationItem } from '@/lib/kipu/types';
import { createKipuRequestConfig } from '@/lib/kipu/auth/signature';
import { getFacilityKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { KipuCredentials, KipuApiResponse } from '@/types/kipu';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';

/**
 * Paginated response for patients
 */
export interface PaginatedPatientsResponse {
  patients: PatientBasicInfo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Lists all patients for a specific facility
 * 
 * @param facilityId - The ID of the facility to get patients for
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of patients per page (default: 20)
 * @param status - Filter patients by status (default: 'active')
 * @returns Promise resolving to a paginated list of patients
 */
export async function listPatients(
  facilityId: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
  status: 'active' | 'inactive' | 'all' = 'active'
): Promise<PaginatedPatientsResponse> {
  try {
    // Call the API endpoint for listing patients
    const response = await fetch(`/api/kipu/patients?page=${page}&limit=${limit}&status=${status}&facilityId=${facilityId}`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch patients';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data as PaginatedPatientsResponse;
  } catch (error) {
    console.error(`Error in listPatients for facility ${facilityId}:`, error);
    // Return empty response with pagination
    return {
      patients: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }
}

/**
 * Gets a specific patient
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @returns Promise resolving to the patient or null if not found
 */
export async function getPatient(facilityId: string, patientId: string): Promise<PatientBasicInfo | null> {
  try {
    console.log(`PatientService - Getting patient ID: ${patientId} in facility: ${facilityId}`);
    
    // Important: We need to make sure the patientId is properly encoded for the URL
    // First decode it to handle any case where it might already be encoded
    const decodedPatientId = decodeURIComponent(patientId);
    
    // Then encode it properly for the URL
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    console.log(`PatientService - Patient ID transformation: Original=${patientId}, Decoded=${decodedPatientId}, Encoded=${encodedPatientId}`);
    
    // Call the API endpoint for getting a patient, including the facilityId as a query parameter
    const response = await fetch(`/api/kipu/patients/${encodedPatientId}?facilityId=${facilityId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`PatientService - API error: ${response.status} ${response.statusText}`, errorData);
      throw new Error(errorData.error || 'Failed to fetch patient');
    }
    
    const patient = await response.json();
    
    if (!patient) {
      console.log('PatientService - No patient data returned from API');
      return null;
    }
    
    console.log('PatientService - Patient data received:', {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`
    });
    
    return patient;
  } catch (error) {
    console.error(`Error in getPatient for patient ${patientId} in facility ${facilityId}:`, error);
    throw error;
  }
}

/**
 * Gets evaluations for a specific patient
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of evaluations per page (default: 20)
 * @returns Promise resolving to the evaluations or empty array if not found
 */
export async function getPatientEvaluations(
  facilityId: string,
  patientId: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT
): Promise<PatientEvaluation[]> {
  try {
    console.log(`PatientService - Getting evaluations for patient ID: ${patientId} in facility: ${facilityId}`);
    
    // Ensure patientId is properly encoded for the URL
    const decodedPatientId = decodeURIComponent(patientId);
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    // Call the API endpoint for getting patient evaluations
    const response = await fetch(
      `/api/kipu/patients/${encodedPatientId}/evaluations?facilityId=${facilityId}&page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch patient evaluations');
    }
    
    const data = await response.json();
    console.log('PatientService - Evaluations data received:', {
      count: data.evaluations?.length || 0,
      pagination: data.pagination
    });
    
    return data.evaluations || [];
  } catch (error) {
    console.error(`Error in getPatientEvaluations for patient ${patientId} in facility ${facilityId}:`, error);
    return [];
  }
}

/**
 * Gets vital signs for a specific patient
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of vital signs per page (default: 20)
 * @returns Promise resolving to the vital signs or empty array if not found
 */
export async function getPatientVitalSigns(
  facilityId: string,
  patientId: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT
): Promise<any[]> {
  try {
    console.log(`PatientService - Getting vital signs for patient ID: ${patientId} in facility: ${facilityId}`);
    
    // Ensure patientId is properly encoded for the URL
    const decodedPatientId = decodeURIComponent(patientId);
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    // Call the API endpoint for getting patient vital signs, including the facilityId as a query parameter
    const response = await fetch(`/api/kipu/patients/${encodedPatientId}/vitals?facilityId=${facilityId}&page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch patient vital signs');
    }
    
    const data = await response.json();
    console.log('PatientService - Vital signs data received:', {
      count: data.vitalSigns?.length || 0,
      pagination: data.pagination
    });
    
    return data.vitalSigns || [];
  } catch (error) {
    console.error(`Error in getPatientVitalSigns for patient ${patientId} in facility ${facilityId}:`, error);
    return [];
  }
}

/**
 * Gets appointments for a specific patient
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of appointments per page (default: 20)
 * @returns Promise resolving to an array of patient appointments
 */
export async function getPatientAppointments(
  facilityId: string,
  patientId: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT
): Promise<any[]> {
  try {
    console.log(`PatientService - Getting appointments for patient ID: ${patientId} in facility: ${facilityId}`);
    
    // Ensure patientId is properly encoded for the URL
    const decodedPatientId = decodeURIComponent(patientId);
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    // Call the API endpoint for getting patient appointments, including the facilityId as a query parameter
    const response = await fetch(`/api/kipu/patients/${encodedPatientId}/appointments?facilityId=${facilityId}&page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch patient appointments');
    }
    
    const data = await response.json();
    console.log('PatientService - Appointments data received:', {
      count: data.appointments?.length || 0,
      pagination: data.pagination
    });
    
    return data.appointments || [];
  } catch (error) {
    console.error(`Error in getPatientAppointments for patient ${patientId} in facility ${facilityId}:`, error);
    return [];
  }
}

/**
 * Gets a specific patient evaluation
 * 
 * @param facilityId - The ID of the facility
 * @param evaluationId - The ID of the evaluation to retrieve
 * @returns Promise resolving to the evaluation details or null if not found
 */
export async function getPatientEvaluation(
  facilityId: string,
  evaluationId: string
): Promise<PatientEvaluation | null> {
  try {
    // Call the API endpoint for getting a patient evaluation
    const response = await fetch(`/api/kipu/facilities/${facilityId}/evaluations/${evaluationId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch patient evaluation');
    }
    
    const data = await response.json();
    return data as PatientEvaluation;
  } catch (error) {
    console.error(`Error in getPatientEvaluation for evaluation ${evaluationId} in facility ${facilityId}:`, error);
    return null;
  }
}

/**
 * Creates a new patient evaluation
 * 
 * @param facilityId - The ID of the facility
 * @param patientId - The ID of the patient
 * @param evaluationData - The evaluation data to create
 * @returns Promise resolving to the created evaluation or null if creation failed
 */
export async function createPatientEvaluation(
  facilityId: string,
  patientId: string,
  evaluationData: Partial<PatientEvaluation>
): Promise<PatientEvaluation | null> {
  try {
    // Call the API endpoint for creating a patient evaluation
    const response = await fetch(`/api/kipu/facilities/${facilityId}/patients/${patientId}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evaluationData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create patient evaluation');
    }
    
    const data = await response.json();
    return data as PatientEvaluation;
  } catch (error) {
    console.error(`Error in createPatientEvaluation for patient ${patientId} in facility ${facilityId}:`, error);
    return null;
  }
}

/**
 * Direct KIPU API call to list patients (server-side function)
 * This function is used internally by the API routes
 * 
 * @param credentials - KIPU API credentials
 * @param locationId - The KIPU location ID (facility ID in our system)
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuListPatients(
  credentials: KipuCredentials,
  locationId: string
): Promise<KipuApiResponse> {
  try {
    console.log(`Making KIPU API call to list patients for location ${locationId}`);
    
    // Construct the endpoint with query parameters
    const endpoint = `/api/patients/census?location_id=${locationId}&app_id=${credentials.appId}&phi_level=high`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Check if the response is empty or not JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Try to parse the response as JSON
      const text = await response.text();
      console.log(`KIPU API Raw Response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      // Only try to parse as JSON if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        console.error('KIPU API returned empty response');
        data = {};
      }
    } catch (parseError: unknown) {
      console.error('Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    // Check if the response is OK
    if (!response.ok) {
      console.error(`KIPU API Error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `KIPU API returned error: ${response.statusText}`
        }
      };
    }
    
    // Log response structure (without sensitive data)
    console.log('KIPU API Patient Response:', {
      success: true,
      hasData: !!data,
      patientCount: data?.patients?.length || 0
    });
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error in kipuListPatients:', error);
    return {
      success: false,
      error: {
        code: '500',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}

/**
 * Direct KIPU API call to get a patient (server-side function)
 * This function is used internally by the API routes
 * 
 * @param patientId - The KIPU patient ID
 * @param locationId - The KIPU location ID (facility ID in our system)
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuGetPatient(
  patientId: string,
  locationId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    console.log(`Making KIPU API call to get patient ${patientId} in location ${locationId}`);
    
    // Ensure the patient ID is properly encoded for the URL
    // The patientId may come from different sources, so we ensure consistent encoding
    // First decode it to handle any case where it might already be encoded
    const decodedPatientId = decodeURIComponent(patientId);
    
    // Then encode it properly for the URL
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    // Log the patient ID transformation for debugging
    console.log(`Patient ID transformation: Original=${patientId}, Decoded=${decodedPatientId}, Encoded=${encodedPatientId}`);
    
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
      // If the format is not as expected, use the whole ID as both parameters
      // This is a fallback that might not work, but it's better than failing immediately
      console.log(`Patient ID format is not as expected. Using the whole ID for both parameters.`);
      locationPatientId = decodedPatientId;
      patientMasterId = decodedPatientId;
    }
    
    // Construct the endpoint with query parameters according to KIPU API documentation
    const endpoint = `/api/patients/${locationPatientId}?app_id=${credentials.appId}&location_id=${locationId}&phi_level=high&patient_master_id=${patientMasterId}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Log the full URL being called (masking sensitive parts)
    console.log(`KIPU API URL: ${credentials.baseUrl}${endpoint.replace(credentials.appId, '***')}`);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Check if the response is empty or not JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Try to parse the response as JSON
      const text = await response.text();
      console.log(`KIPU API Raw Response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      // Only try to parse as JSON if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        console.error('KIPU API returned empty response');
        data = {};
      }
    } catch (parseError: unknown) {
      console.error('Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    // Log response structure (without sensitive data)
    console.log('KIPU API Patient Response:', {
      success: response.ok,
      hasData: !!data,
      hasPatient: !!data.patient,
      status: response.status,
      errorMessage: !response.ok ? (data?.error || data?.message || 'Unknown error') : undefined
    });
    
    // If we have a 422 error, log more details to help diagnose
    if (response.status === 422) {
      console.error('KIPU API 422 Error Details:', {
        endpoint,
        locationId,
        patientIdFormat: typeof patientId,
        patientIdLength: patientId.length,
        responseData: data
      });
    }
    
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || data.message || 'Failed to get patient from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuGetPatient for patient ${patientId} in location ${locationId}:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}

/**
 * Direct KIPU API call to get patient evaluations (server-side function)
 * This function is used internally by the API routes
 * 
 * @param patientId - The KIPU patient ID
 * @param locationId - The KIPU location ID (facility ID in our system)
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuGetPatientEvaluations(
  patientId: string,
  locationId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    console.log(`[KIPU DEBUG] Making KIPU API call to get evaluations for patient ${patientId} in location ${locationId}`);
    console.log(`[KIPU DEBUG] Credentials being used: API ID: ${credentials.accessId.substring(0, 4)}..., Base URL: ${credentials.baseUrl}`);
    
    // Ensure the patient ID is properly encoded for the URL
    // The patientId may come from different sources, so we ensure consistent encoding
    // First decode it to handle any case where it might already be encoded
    const decodedPatientId = decodeURIComponent(patientId);
    
    // Then encode it properly for the URL
    const encodedPatientId = encodeURIComponent(decodedPatientId);
    
    // Log the patient ID transformation for debugging
    console.log(`[KIPU DEBUG] Patient ID transformation: Original=${patientId}, Decoded=${decodedPatientId}, Encoded=${encodedPatientId}`);
    
    // Add detailed logging about the patient ID format
    const patientIdParts = decodedPatientId.split(':');
    console.log(`[KIPU DEBUG] Patient ID format analysis: Parts=${patientIdParts.length}, Format=${patientIdParts.length === 2 ? 'Valid (number:uuid)' : 'Invalid'}`);
    
    // According to KIPU API documentation:
    // - The path parameter should be the Location Patient ID (an integer)
    // - The query parameter patient_master_id should be the Patient Master UUID
    let locationPatientId: string;
    let patientMasterId: string;
    
    if (patientIdParts.length === 2) {
      console.log(`[KIPU DEBUG] Patient ID components: Numeric part=${patientIdParts[0]}, UUID part=${patientIdParts[1]}`);
      locationPatientId = patientIdParts[0];
      patientMasterId = patientIdParts[1];
    } else {
      // If the format is not as expected, use the whole ID as both parameters
      // This is a fallback that might not work, but it's better than failing immediately
      console.log(`[KIPU DEBUG] Patient ID format is not as expected. Using the whole ID for both parameters.`);
      locationPatientId = decodedPatientId;
      patientMasterId = decodedPatientId;
    }
    
    // Construct the endpoint with query parameters according to KIPU API documentation
    const endpoint = `/api/patients/${locationPatientId}/patient_evaluations?app_id=${credentials.appId}&location_id=${locationId}&phi_level=high&patient_master_id=${patientMasterId}`;
    
    console.log(`[KIPU DEBUG] Constructed endpoint: ${endpoint}`);
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    console.log(`[KIPU DEBUG] Request headers:`, {
      Authorization: requestConfig.headers && typeof requestConfig.headers === 'object' && 'Authorization' in requestConfig.headers ? 'Present (not showing full token)' : 'Missing',
      'Content-Type': requestConfig.headers && typeof requestConfig.headers === 'object' && 'Content-Type' in requestConfig.headers ? requestConfig.headers['Content-Type'] : 'Missing',
      'X-Kipu-API-Date': requestConfig.headers && typeof requestConfig.headers === 'object' && 'X-Kipu-API-Date' in requestConfig.headers ? requestConfig.headers['X-Kipu-API-Date'] : 'Missing',
      'X-Kipu-API-Key': requestConfig.headers && typeof requestConfig.headers === 'object' && 'X-Kipu-API-Key' in requestConfig.headers ? 'Present (not showing full key)' : 'Missing',
    });
    
    // Make the API call
    console.log(`[KIPU DEBUG] Making fetch request to: ${credentials.baseUrl}${endpoint}`);
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`[KIPU DEBUG] KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Check if the response is empty or not JSON
    const contentType = response.headers.get('content-type');
    console.log(`[KIPU DEBUG] Response content type: ${contentType}`);
    
    let data;
    
    try {
      // Try to parse the response as JSON
      const text = await response.text();
      console.log(`[KIPU DEBUG] KIPU API Raw Response (first 500 chars): ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
      
      // Only try to parse as JSON if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
        console.log(`[KIPU DEBUG] Successfully parsed JSON response`);
      } else {
        console.error('[KIPU DEBUG] KIPU API returned empty response');
        data = {};
      }
    } catch (parseError: unknown) {
      console.error('[KIPU DEBUG] Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    // Log response structure (without sensitive data)
    console.log('[KIPU DEBUG] KIPU API Patient Evaluations Response:', {
      success: response.ok,
      hasData: !!data,
      evaluationsCount: data?.evaluations?.length || 0,
      dataKeys: data ? Object.keys(data) : [],
      evaluationsStructure: data?.evaluations ? 
        `Array with ${data.evaluations.length} items` + 
        (data.evaluations.length > 0 ? `, first item keys: ${Object.keys(data.evaluations[0]).join(', ')}` : '') : 
        'Not present or not an array'
    });
    
    if (data?.evaluations && Array.isArray(data.evaluations) && data.evaluations.length === 0) {
      console.log('[KIPU DEBUG] KIPU API returned an empty evaluations array. This may be expected if the patient has no evaluations.');
    }
    
    if (!response.ok) {
      console.error('[KIPU DEBUG] KIPU API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data?.error || 'No specific error message provided'
      });
    }
    
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to get patient evaluations from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`[KIPU DEBUG] Error in kipuGetPatientEvaluations for patient ${patientId} in location ${locationId}:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}

/**
 * Direct KIPU API call to get a specific patient evaluation (server-side function)
 * This function is used internally by the API routes
 * 
 * @param evaluationId - The KIPU evaluation ID
 * @param locationId - The KIPU location ID (facility ID in our system)
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuGetPatientEvaluation(
  evaluationId: string,
  locationId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    console.log(`Making KIPU API call to get evaluation ${evaluationId} in location ${locationId}`);
    
    // Ensure the evaluation ID is properly encoded for the URL
    const encodedEvaluationId = encodeURIComponent(evaluationId);
    console.log(`Evaluation ID transformation: Original=${evaluationId}, Encoded=${encodedEvaluationId}`);
    
    // Construct the endpoint with query parameters
    const endpoint = `/api/patient_evaluations/${encodedEvaluationId}?app_id=${credentials.appId}&location_id=${locationId}&phi_level=high`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Check if the response is empty or not JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Try to parse the response as JSON
      const text = await response.text();
      console.log(`KIPU API Raw Response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      // Only try to parse as JSON if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        console.error('KIPU API returned empty response');
        data = {};
      }
    } catch (parseError: unknown) {
      console.error('Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to get patient evaluation from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuGetPatientEvaluation for evaluation ${evaluationId} in location ${locationId}:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}

/**
 * Direct KIPU API call to create a patient evaluation (server-side function)
 * This function is used internally by the API routes
 * 
 * @param patientId - The KIPU patient ID
 * @param evaluationData - The evaluation data to create
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuCreatePatientEvaluation(
  patientId: string,
  evaluationData: any,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    console.log(`Making KIPU API call to create evaluation for patient ${patientId}`);
    
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
      // If the format is not as expected, use the whole ID as both parameters
      // This is a fallback that might not work, but it's better than failing immediately
      console.log(`Patient ID format is not as expected. Using the whole ID for both parameters.`);
      locationPatientId = decodedPatientId;
      patientMasterId = decodedPatientId;
    }
    
    // Then properly encode it for the URL
    const encodedLocationPatientId = encodeURIComponent(locationPatientId);
    
    console.log(`Patient ID: Original=${patientId}, Decoded=${decodedPatientId}, Encoded Location Patient ID=${encodedLocationPatientId}`);
    
    // Get the location ID from the evaluation data or use a default
    const locationId = evaluationData.locationId || evaluationData.facilityId;
    
    if (!locationId) {
      console.error('No location ID provided in evaluation data');
      return {
        success: false,
        error: {
          code: 'MISSING_LOCATION_ID',
          message: 'Location ID is required for creating a patient evaluation'
        }
      };
    }
    
    // Construct the endpoint with query parameters
    const endpoint = `/api/patients/${encodedLocationPatientId}/patient_evaluations?app_id=${credentials.appId}&location_id=${locationId}&phi_level=high&patient_master_id=${patientMasterId}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('POST', endpoint, credentials, evaluationData);
    
    // Log the full URL being called (masking sensitive parts)
    console.log(`KIPU API URL: ${credentials.baseUrl}/api/patients/${encodedLocationPatientId}/patient_evaluations?app_id=***&phi_level=high`);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Check if the response is empty or not JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Try to parse the response as JSON
      const text = await response.text();
      console.log(`KIPU API Raw Response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      // Only try to parse as JSON if we have content
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        console.error('KIPU API returned empty response');
        data = {};
      }
    } catch (parseError: unknown) {
      console.error('Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to create patient evaluation in KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuCreatePatientEvaluation for patient ${patientId}:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}

/**
 * Maps a KIPU evaluation to our PatientEvaluation type
 * This function handles the terminology mapping between systems
 * 
 * @param kipuEvaluation - The KIPU evaluation data
 * @returns Mapped PatientEvaluation object
 */
export function mapKipuEvaluationToPatientEvaluation(kipuEvaluation: KipuEvaluation): PatientEvaluation {
  return {
    id: kipuEvaluation.id.toString(),
    patient_id: kipuEvaluation.patient_id.toString(),
    evaluation_type: kipuEvaluation.evaluation_type,
    notes: kipuEvaluation.notes || '',
    created_at: kipuEvaluation.created_at,
    updated_at: kipuEvaluation.updated_at,
    created_by: kipuEvaluation.user_name,
    status: kipuEvaluation.status as 'draft' | 'completed' | 'reviewed',
    items: kipuEvaluation.items?.map(item => ({
      id: item.id,
      evaluation_id: kipuEvaluation.id.toString(),
      evaluation_item_id: parseInt(item.id) || 0,
      name: item.question,
      field_type: 'text' as any, // Default field type
      label: item.question,
      optional: true,
      divider_below: false,
      question: item.question,
      answer: item.answer || '',
      answer_type: 'text',
      required: false,
      created_at: kipuEvaluation.created_at,
      value: item.answer || '',
      updated_at: kipuEvaluation.updated_at
    })) || []
  };
}

/**
 * Gets all patient data for a facility
 * This function is used to replace the getFacilityData function in the patientStore
 * 
 * @param facilityId - The ID of the facility
 * @returns Promise resolving to the facility data with patients
 */
export async function getFacilityData(facilityId: string): Promise<any> {
  try {
    // Get facility details
    const facilityResponse = await fetch(`/api/kipu/facilities/${facilityId}`);
    if (!facilityResponse.ok) {
      throw new Error('Failed to fetch facility data');
    }
    const facilityData = await facilityResponse.json();
    
    // Get patients for the facility
    const patientsResponse = await fetch(`/api/kipu/facilities/${facilityId}/patients?limit=100`);
    if (!patientsResponse.ok) {
      throw new Error('Failed to fetch patients data');
    }
    const patientsData = await patientsResponse.json();
    
    // Return combined data
    return {
      ...facilityData,
      data: {
        ...facilityData.data,
        patients: patientsData.patients || []
      }
    };
  } catch (error) {
    console.error(`Error in getFacilityData for facility ${facilityId}:`, error);
    return {
      id: facilityId,
      name: 'Unknown Facility',
      data: {
        patients: []
      }
    };
  }
}

/**
 * Define the PatientVitalSign interface
 */
export interface PatientVitalSign {
  id: string;
  patient_id: string;
  timestamp: string;
  systolic?: string | number;
  diastolic?: string | number;
  pulse?: string | number;
  respirations?: string | number;
  temperature?: string | number;
  o2_saturation?: string | number;
  height?: string | number;
  weight?: string | number;
  bmi?: string | number;
  pain_level?: string | number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}
