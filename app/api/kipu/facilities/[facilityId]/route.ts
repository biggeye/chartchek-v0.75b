import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { mapKipuLocationToFacility } from '@/lib/kipu/mapping';

/**
 * GET /api/kipu/facilities/[facilityId]
 * Gets detailed information about a specific facility (KIPU location)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { facilityId: string } }
) {
  try {
    // Check authentication
    const supabase = await createServer();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
    
    // Get facility ID from route params
    const facilityId = params.facilityId;
    
    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }
    
    // Get the KIPU credentials for the current user
    const credentials = await getKipuCredentials();
    
    // Check if KIPU credentials are configured
    if (!credentials) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'KIPU API credentials are not configured. Please configure your API settings first.' 
        },
        { status: 400 }
      );
    }
    
    // Create masked credentials for logging (we'll mask the secret key)
    const maskedCredentials = {
      ...credentials,
      secretKey: credentials.secretKey ? '********' : 'not set',
    };
    
    console.log(`Fetching facility ${facilityId} from KIPU API with credentials:`, maskedCredentials);
    
    // Call KIPU API to get the specific location
    const response = await kipuServerGet<{ location?: any }>(`locations/${facilityId}`, credentials);
    
    // Log the raw data structure to understand the format
    console.log('Facility Detail API Route - Data Structure:', {
      hasLocation: !!response.data?.location,
      locationId: response.data?.location?.location_id
    });
    
    if (!response.success || !response.data || !response.data.location) {
      return NextResponse.json(
        { error: response.error?.message || 'Facility not found' },
        { status: response.error?.code ? parseInt(response.error.code) : 404 }
      );
    }
    
    // Map KIPU location to our facility format
    const facility = mapKipuLocationToFacility(response.data.location);
    
    // Add caching headers (15 minutes)
    return NextResponse.json(facility, {
      headers: {
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error getting facility:', error);
    return NextResponse.json(
      { error: 'Failed to get facility' },
      { status: 500 }
    );
  }
}
