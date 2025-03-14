/**
 * Facility Service for KIPU Integration
 * 
 * This service handles the communication with the KIPU EMR system
 * for facility-related operations. It provides a consistent interface
 * for both real API calls and fallback to JSON files.
 */

import { createClient } from '@/utils/supabase/client';
import { Facility, FacilityData } from '../types';
import facility1Data from '../facilities/facility_1.json';
import facility2Data from '../facilities/facility_2.json';

// Environment variables
const USE_KIPU_API = process.env.USE_KIPU_API === 'true' || false; // Default to JSON fallback

/**
 * Get a facility by ID
 * 
 * @param facilityId - The ID of the facility to retrieve
 * @returns Promise resolving to a Facility object or null if not found
 */
export async function getFacility(facilityId: string): Promise<Facility | null> {
  try {
    if (USE_KIPU_API) {
      // Attempt to use KIPU API
      const apiSettings = await getFacilityApiSettings(facilityId);
      
      if (apiSettings && apiSettings.kipu_api_key && apiSettings.kipu_api_endpoint) {
        // Make API call to KIPU
        console.log(`Making API call to KIPU for facility ${facilityId}`);
        
        // TODO: Implement actual KIPU API call with proper authentication
        // const response = await fetch(...);
        
        // For now, fall back to JSON files
        console.log('KIPU API call not implemented yet, falling back to JSON');
        return getFacilityFromJson(facilityId);
      } else {
        console.log(`No API settings found for facility ${facilityId}, falling back to JSON`);
        return getFacilityFromJson(facilityId);
      }
    } else {
      // Use JSON files directly
      console.log(`Using JSON files for facility ${facilityId}`);
      return getFacilityFromJson(facilityId);
    }
  } catch (error) {
    console.error('Error fetching facility:', error);
    // Attempt fallback to JSON files on error
    try {
      console.log('Error in KIPU API call, falling back to JSON');
      return getFacilityFromJson(facilityId);
    } catch (fallbackError) {
      console.error('Error in JSON fallback:', fallbackError);
      return null;
    }
  }
}

/**
 * List all facilities with optional filtering and pagination
 * 
 * @param options - Optional parameters for filtering and pagination
 * @returns Promise resolving to an object with facilities array and pagination info
 */
export async function listFacilities(options: {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'all';
  sort?: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc';
} = {}): Promise<{
  facilities: Facility[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> {
  try {
    if (USE_KIPU_API) {
      // Attempt to use KIPU API
      // TODO: Implement actual KIPU API call with proper authentication
      // const response = await fetch(...);
      
      // For now, fall back to JSON files
      console.log('KIPU API call not implemented yet, falling back to JSON');
      return listFacilitiesFromJson(options);
    } else {
      // Use JSON files directly
      console.log('Using JSON files for facility listing');
      return listFacilitiesFromJson(options);
    }
  } catch (error) {
    console.error('Error listing facilities:', error);
    // Attempt fallback to JSON files on error
    try {
      console.log('Error in KIPU API call, falling back to JSON');
      return listFacilitiesFromJson(options);
    } catch (fallbackError) {
      console.error('Error in JSON fallback:', fallbackError);
      return {
        facilities: [],
        pagination: {
          total: 0,
          page: options.page || 1,
          limit: options.limit || 20,
          pages: 0
        }
      };
    }
  }
}

/**
 * Update facility information
 * 
 * @param facilityId - The ID of the facility to update
 * @param data - The updated facility data
 * @returns Promise resolving to the updated Facility or null if update failed
 */
export async function updateFacility(
  facilityId: string, 
  data: Partial<Facility>
): Promise<Facility | null> {
  try {
    if (USE_KIPU_API) {
      // Attempt to use KIPU API
      const apiSettings = await getFacilityApiSettings(facilityId);
      
      if (apiSettings && apiSettings.kipu_api_key && apiSettings.kipu_api_endpoint) {
        // Make API call to KIPU
        console.log(`Making API call to KIPU to update facility ${facilityId}`);
        
        // TODO: Implement actual KIPU API call with proper authentication
        // const response = await fetch(...);
        
        // For now, just return the existing facility
        console.log('KIPU API update not implemented yet');
        return getFacilityFromJson(facilityId);
      } else {
        console.log(`No API settings found for facility ${facilityId}`);
        return getFacilityFromJson(facilityId);
      }
    } else {
      // For JSON files, we can't actually update them, so just return the existing facility
      console.log(`Using JSON files for facility ${facilityId} (no actual update performed)`);
      return getFacilityFromJson(facilityId);
    }
  } catch (error) {
    console.error('Error updating facility:', error);
    return null;
  }
}

/**
 * Get facility API settings from Supabase or local storage
 * 
 * @param facilityId - The ID of the facility
 * @returns Promise resolving to API settings or null if not found
 */
export async function getFacilityApiSettings(facilityId: string): Promise<{
  kipu_api_key?: string;
  kipu_api_endpoint?: string;
  has_api_key_configured: boolean;
  updated_at?: string;
} | null> {
  try {
    // Try to get API settings from Supabase
    const supabase = createClient();
    const { data: apiSettings, error } = await supabase
      .from('facility_api_settings')
      .select('*')
      .eq('facility_id', facilityId)
      .single();
    
    if (error || !apiSettings) {
      // Fall back to JSON files
      return getLocalJsonApiSettings(facilityId);
    }
    
    return apiSettings;
  } catch (error) {
    console.error('Error fetching API settings:', error);
    // Fall back to JSON files
    return getLocalJsonApiSettings(facilityId);
  }
}

/**
 * Get API settings from JSON files
 * 
 * @param facilityId - The ID of the facility
 * @returns API settings or null if not found
 */
function getLocalJsonApiSettings(facilityId: string): {
  kipu_api_key?: string;
  kipu_api_endpoint?: string;
  has_api_key_configured: boolean;
  updated_at?: string;
} | null {
  if (facilityId === 'facility_1' && 'api_settings' in facility1Data) {
    return (facility1Data as any).api_settings || {
      kipu_api_key: '',
      kipu_api_endpoint: '',
      has_api_key_configured: false,
      updated_at: new Date().toISOString()
    };
  } else if (facilityId === 'facility_2' && 'api_settings' in facility2Data) {
    return (facility2Data as any).api_settings || {
      kipu_api_key: '',
      kipu_api_endpoint: '',
      has_api_key_configured: false,
      updated_at: new Date().toISOString()
    };
  }
  
  return null;
}

/**
 * Transform JSON data to match the FacilityData type
 * 
 * @param data - The raw data from JSON
 * @returns Properly formatted FacilityData object
 */
function transformFacilityData(data: any): FacilityData {
  // Create a deep copy to avoid modifying the original data
  const transformedData = JSON.parse(JSON.stringify(data));
  
  // Fix billing_data.upcomingReviews if it exists
  if (transformedData?.billing_data?.upcomingReviews) {
    transformedData.billing_data.upcomingReviews = transformedData.billing_data.upcomingReviews.map((review: any) => {
      // Add reviewType if missing
      if (!review.reviewType && review.insuranceProvider) {
        return {
          patientName: review.patientName,
          date: review.date,
          reviewType: review.insuranceProvider || 'Standard Review' // Use insuranceProvider as reviewType or default
        };
      }
      return review;
    });
  }
  
  return transformedData as FacilityData;
}

/**
 * Get a facility from JSON files
 * 
 * @param facilityId - The ID of the facility
 * @returns Facility object or null if not found
 */
function getFacilityFromJson(facilityId: string): Facility | null {
  if (facilityId === 'facility_1') {
    const patients1Count = facility1Data.data?.patients ? facility1Data.data.patients.length : 0;
    const documents1Count = 
      (facility1Data.data?.evaluations ? facility1Data.data.evaluations.length : 0) + 
      (facility1Data.data?.contacts ? facility1Data.data.contacts.length : 0);
    
    // Transform the data to match the expected types
    const transformedData = transformFacilityData(facility1Data.data);
    
    return {
      id: facility1Data.facility_id,
      facility_id: facility1Data.facility_id,
      name: facility1Data.name,
      address: facility1Data.address,
      phone: facility1Data.phone,
      email: facility1Data.email,
      created_at: facility1Data.created_at,
      data: transformedData,
      api_settings: facility1Data.api_settings || {
        kipu_api_key: '',
        kipu_api_endpoint: '',
        has_api_key_configured: false,
        updated_at: new Date().toISOString()
      },
      meta: {
        name: facility1Data.name,
        address: facility1Data.address,
        phone: facility1Data.phone,
        email: facility1Data.email,
        patients_count: patients1Count,
        documents_count: documents1Count
      }
    };
  } else if (facilityId === 'facility_2') {
    const patients2Count = facility2Data.data?.patients ? facility2Data.data.patients.length : 0;
    const documents2Count = 
      (facility2Data.data?.evaluations ? facility2Data.data.evaluations.length : 0) + 
      (facility2Data.data?.contacts ? facility2Data.data.contacts.length : 0);
    
    // Transform the data to match the expected types
    const transformedData = transformFacilityData(facility2Data.data);
    
    return {
      id: facility2Data.facility_id,
      facility_id: facility2Data.facility_id,
      name: facility2Data.name,
      address: facility2Data.address,
      phone: facility2Data.phone,
      email: facility2Data.email,
      created_at: facility2Data.created_at,
      data: transformedData,
      api_settings: facility2Data.api_settings || {
        kipu_api_key: '',
        kipu_api_endpoint: '',
        has_api_key_configured: false,
        updated_at: new Date().toISOString()
      },
      meta: {
        name: facility2Data.name,
        address: facility2Data.address,
        phone: facility2Data.phone,
        email: facility2Data.email,
        patients_count: patients2Count,
        documents_count: documents2Count
      }
    };
  }
  
  return null;
}

/**
 * List facilities from JSON files
 * 
 * @param options - Optional parameters for filtering and pagination
 * @returns Object with facilities array and pagination info
 */
function listFacilitiesFromJson(options: {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'all';
  sort?: 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc';
} = {}): {
  facilities: Facility[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
} {
  const {
    page = 1,
    limit = 20,
    status = 'active',
    sort = 'name_asc'
  } = options;
  
  // Get all facilities
  const facilities: Facility[] = [];
  
  // Add facility 1
  const facility1 = getFacilityFromJson('facility_1');
  if (facility1) facilities.push(facility1);
  
  // Add facility 2
  const facility2 = getFacilityFromJson('facility_2');
  if (facility2) facilities.push(facility2);
  
  // Filter by status if not 'all' (all facilities are active in our JSON data)
  let filteredFacilities = status === 'all' 
    ? [...facilities]
    : facilities.filter(facility => status === 'active'); // All our facilities are active
  
  // Sort facilities
  switch (sort) {
    case 'name_asc':
      filteredFacilities.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      filteredFacilities.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'created_at_asc':
      filteredFacilities.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'created_at_desc':
      filteredFacilities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedFacilities = filteredFacilities.slice(startIndex, endIndex);
  
  return {
    facilities: paginatedFacilities,
    pagination: {
      total: filteredFacilities.length,
      page,
      limit,
      pages: Math.ceil(filteredFacilities.length / limit)
    }
  };
}

/**
 * Map KIPU location terminology to our facility terminology
 * 
 * @param kipuLocation - The location object from KIPU API
 * @returns A Facility object with mapped fields
 */
export function mapKipuLocationToFacility(kipuLocation: any): Facility {
  // This function maps the KIPU location object to our Facility type
  return {
    id: kipuLocation.location_id || kipuLocation.id,
    facility_id: kipuLocation.location_id || kipuLocation.id,
    name: kipuLocation.location_name || kipuLocation.name,
    address: kipuLocation.address || '',
    phone: kipuLocation.phone || '',
    email: kipuLocation.email || '',
    created_at: kipuLocation.created_at || new Date().toISOString(),
    data: transformFacilityData(kipuLocation.data || {}),
    meta: {
      name: kipuLocation.location_name || kipuLocation.name,
      address: kipuLocation.address || '',
      phone: kipuLocation.phone || '',
      email: kipuLocation.email || '',
    }
  };
}