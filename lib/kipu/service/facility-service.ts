/**
 * Facility Service
 * 
 * This service handles interactions with the KIPU API for facility-related operations.
 * It provides functions for listing facilities, getting facility details, and updating facilities.
 */

import { Facility, KipuCredentials, KipuApiResponse } from '@/types/kipu';
import { createKipuRequestConfig } from '@/lib/kipu/auth/signature';
import { getFacilityKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { createClient } from '@/utils/supabase/client';
import { mapKipuLocationToFacility } from '@/lib/kipu/mapping';

/**
 * Paginated response for facilities
 */
export interface PaginatedFacilitiesResponse {
  facilities: Facility[];
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
 * Lists all facilities available to the authenticated user
 * 
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of facilities per page (default: 20)
 * @param status - Filter facilities by status (default: 'active')
 * @param sort - Sort order for facilities (default: 'name_asc')
 * @returns Promise resolving to a paginated list of facilities
 */
export async function listFacilities(
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
  status: 'active' | 'inactive' | 'all' = 'active',
  sort: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' = 'name_asc'
): Promise<PaginatedFacilitiesResponse> {
  try {
    // Call the API endpoint for listing facilities
    const response = await fetch(`/api/kipu/facilities?status=${status}&sort=${sort}&page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch facilities';
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
    console.log("facility-service (listFacilities) - API response data:", data);

    // Map KIPU locations to our Facility type
    const facilities = data.facilities ? data.facilities : [];
    
    return {
      facilities,
      pagination: {
        total: data.pagination?.total || 0,
        page,
        limit,
        pages: data.pagination?.pages || 0
      }
    };
  } catch (error) {
    console.error('Error in listFacilities:', error);
    // Return empty response with pagination
    return {
      facilities: [],
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
 * Gets detailed information about a specific facility
 * 
 * @param facilityId - The ID of the facility to retrieve
 * @returns Promise resolving to the facility details or null if not found
 */
export async function getFacility(facilityId: string): Promise<Facility | null> {
  try {
    // Call the API endpoint for getting a facility
    const response = await fetch(`/api/kipu/facilities/${facilityId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Facility ${facilityId} not found`);
        return null;
      }

      let errorMessage = 'Failed to fetch facility';
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
    console.log("facility-service (getFacility) - API response data:", data);

    // Map KIPU location to our Facility type
    return mapKipuLocationToFacility(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in getFacility for facility ${facilityId}:`, error.message);
    } else {
      console.error(`Error in getFacility for facility ${facilityId}:`, error);
    }
    return null;
  }
}

/**
 * Updates a facility (server-side function)
 * 
 * @param facilityId - The ID of the facility to update
 * @param facilityData - The updated facility data
 * @returns Promise resolving to the updated facility or null if update failed
 */
export async function updateFacility(
  facilityId: string,
  facilityData: Partial<Facility>
): Promise<Facility | null> {
  try {
    // Call the API endpoint for updating a facility
    const response = await fetch(`/api/kipu/facilities/${facilityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(facilityData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update facility');
    }
    
    const data = await response.json();
    console.log("facility-service (updateFacility) - API response data:", data);

    return data as Facility;
  } catch (error) {
    console.error(`Error in updateFacility for facility ${facilityId}:`, error);
    return null;
  }
}

/**
 * Direct KIPU API call to list facilities (server-side function)
 * This function is used internally by the API routes
 * 
 * @param credentials - KIPU API credentials
 * @param includeBuildings - Whether to include buildings in the response
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuListFacilities(
  credentials: KipuCredentials,
  includeBuildings: boolean = true
): Promise<KipuApiResponse> {
  try {
    // Construct the endpoint with query parameters
    const endpoint = `/locations?app_id=${credentials.appId}&include_buildings=${includeBuildings}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
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
    
    // Parse JSON response
    try {
      const data = await response.json();
      console.log("facility-service (kipuListFacilities) - API response data:", data);

      // Validate that the response contains locations
      if (!data || !data.locations || !Array.isArray(data.locations)) {
        console.error('KIPU API returned invalid data structure:', data);
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'KIPU API response does not contain locations array',
            details: data
          }
        };
      }
      
      return {
        success: true,
        data: data
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
    console.error('Error in kipuListFacilities:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
        details: error
      }
    };
  }
}

/**
 * Direct KIPU API call to get a facility (server-side function)
 * This function is used internally by the API routes
 * 
 * @param facilityId - The KIPU location ID
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the KIPU API response
 */
export async function kipuGetFacility(
  facilityId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse> {
  try {
    // Construct the endpoint with query parameters
    const endpoint = `/locations/${facilityId}?app_id=${credentials.appId}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    const data = await response.json();
    console.log("facility-service (kipuGetFacility) - API response data:", data);

    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to get facility from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuGetFacility for facility ${facilityId}:`, error);
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
 * Tests the connection to the KIPU API for a specific facility
 * This function is used by the test-connection API endpoint
 * 
 * @param facilityId - The ID of the facility to test
 * @returns Promise resolving to a success/failure result with message
 */
export async function testKipuConnection(
  facilityId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the KIPU credentials for the facility
    const credentials = await getFacilityKipuCredentials(facilityId);
    
    if (!credentials) {
      return {
        success: false,
        message: 'No KIPU API credentials configured for this facility'
      };
    }
    
    // Try to list facilities as a test
    const result = await kipuListFacilities(credentials, false);
    
    if (result.success) {
      return {
        success: true,
        message: 'Successfully connected to KIPU API'
      };
    } else {
      return {
        success: false,
        message: result.error?.message || 'Failed to connect to KIPU API'
      };
    }
  } catch (error) {
    console.error(`Error testing KIPU connection for facility ${facilityId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while testing the connection'
    };
  }
}

/**
 * Enriches a facility with additional data from other KIPU API endpoints
 * This function is used to add patient counts, document counts, etc.
 * 
 * @param facility - The base facility object
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the enriched facility
 */
export async function enrichFacilityWithData(
  facility: Facility,
  credentials: KipuCredentials
): Promise<Facility> {
  try {
    // Get patient census data
    const patientCensusEndpoint = `/patients/census?app_id=${credentials.appId}&location_id=${facility.id}`;
    const patientCensusConfig = createKipuRequestConfig('GET', patientCensusEndpoint, credentials);
    const patientCensusResponse = await fetch(`${credentials.baseUrl}${patientCensusEndpoint}`, patientCensusConfig);
    
    if (patientCensusResponse.ok) {
      const patientCensusData = await patientCensusResponse.json();
      console.log("facility-service (enrichFacilityWithData) - Patient census data:", patientCensusData);

      // Update facility data with patient counts
      if (facility.data && facility.data.patients) {
        facility.data.patients.total = patientCensusData.total || 0;
        facility.data.patients.admitted = patientCensusData.admitted || 0;
        facility.data.patients.discharged = patientCensusData.discharged || 0;
      }
      
      // Update occupancy data if available
      if (facility.data && facility.data.beds && patientCensusData.occupancy) {
        facility.data.beds.total = patientCensusData.occupancy.total_beds || 0;
        facility.data.beds.occupied = patientCensusData.occupancy.occupied_beds || 0;
        facility.data.beds.available = patientCensusData.occupancy.available_beds || 0;
      }
    }
    
    // Check if API settings are configured for this facility
    const supabase = await createClient();
    const { data: apiSettings } = await supabase
      .from('user_api_settings')
      .select('has_api_key_configured, updated_at')
      .eq('facility_id', facility.id)
      .eq('has_api_key_configured', true)
      .limit(1)
      .single();
    
    if (apiSettings) {
      facility.api_settings = {
        has_api_key_configured: apiSettings.has_api_key_configured,
        updated_at: apiSettings.updated_at
      };
    }
    
    return facility;
  } catch (error) {
    console.error(`Error enriching facility ${facility.id} with data:`, error);
    // Return the original facility if enrichment fails
    return facility;
  }
}

/**
 * Fetches facilities directly from KIPU API and updates the facility store
 * This function is used when saving API credentials to immediately populate the facility list
 * 
 * @param credentials - KIPU API credentials
 * @returns Promise resolving to the list of facilities
 */
export async function fetchAndStoreFacilities(
  credentials: KipuCredentials
): Promise<Facility[]> {
  try {
    console.log('Fetching facilities with credentials:', {
      ...credentials,
      secretKey: credentials.secretKey ? '********' : 'not set'
    });
    
    // Use the server-side API route to avoid CORS issues
    const response = await fetch('/api/kipu/facilities/fetch-with-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credentials })
    });
    
    const result = await response.json();
    console.log("facility-service (fetchAndStoreFacilities) - API response data:", result);

    if (!result.success || !result.data) {
      console.error('Failed to fetch facilities from KIPU API:', result.error || 'Unknown error');
      return [];
    }
    
    if (!Array.isArray(result.data.locations)) {
      console.error('Invalid response format. Expected locations array, got:', result.data);
      return [];
    }
    
    // Define the expected location type based on the API response
    interface KipuLocation {
      location_id: number;
      location_name: string;
      enabled: boolean;
      [key: string]: any;
    }
    
    // Map KIPU locations to our Facility type
    const facilities = result.data.locations.map((location: KipuLocation) => mapKipuLocationToFacility(location));
    
    console.log(`Mapped ${facilities.length} facilities from KIPU API`);
    
    // Update the facility store with the fetched facilities
    const { useFacilityStore } = await import('@/store/facilityStore');
    const store = useFacilityStore.getState();
    
    // Set the facilities in the store
    store.facilities = facilities;
    useFacilityStore.setState({ 
      facilities,
      pagination: {
        total: facilities.length,
        page: 1,
        limit: facilities.length,
        pages: 1
      },
      isLoading: false,
      error: null
    });
    
    // If there are facilities and no current facility is selected, select the first one
    if (facilities.length > 0 && !store.currentFacilityId) {
      store.setCurrentFacility(facilities[0].id);
    }
    
    return facilities;
  } catch (error) {
    console.error('Error fetching and storing facilities:', error);
    return [];
  }
}
