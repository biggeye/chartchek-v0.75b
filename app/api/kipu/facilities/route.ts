import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { Facility } from '@/types/kipu';
import { mapKipuLocationToFacility } from '@/lib/kipu/mapping';

/**
 * GET /api/kipu/facilities
 * Lists all facilities (KIPU locations) available to the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'active';
    const sort = url.searchParams.get('sort') || 'name_asc';
    
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


    const response = await kipuServerGet<{ locations?: any[] }>('/api/locations', credentials);
    
    
    // Map KIPU locations to our facility format
    const facilities: Facility[] = [];
    
    // Check if we have valid data from KIPU
    if (response.success && response.data) {
      // Safely access the locations array with proper type checking
      const locations = response.data.locations as any[] || [];
      if (Array.isArray(locations)) {
        // Map KIPU locations to our facility structure using the dedicated mapping function
        facilities.push(...locations.map(location => mapKipuLocationToFacility(location)));
      }
    }
    
    // Filter facilities by status if needed
    const filteredFacilities = status === 'all' 
      ? facilities 
      : facilities.filter(f => status === 'active' ? f.status === 'active' : f.status === 'inactive');
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFacilities = filteredFacilities.slice(startIndex, endIndex);
    
    // Add caching headers (5 minutes with stale-while-revalidate for 1 minute)
    // This implements the multi-level caching strategy mentioned in the integration README
    return NextResponse.json({
      facilities: paginatedFacilities,
      pagination: {
        total: filteredFacilities.length,
        page,
        limit,
        pages: Math.ceil(filteredFacilities.length / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'Vary': 'Authorization' // Ensure cache varies by user authentication
      }
    });

  } catch (error) {
    console.error('Error in facilities list endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve facilities from KIPU API' },
      { status: 500 }
    );
  }
}