import { NextRequest, NextResponse } from 'next/server';
import { getFacility } from '@/lib/kipu/service/facility-service';
import { createServer } from '@/utils/supabase/server';

/**
 * GET /api/kipu/facilities/[facility_id]
 * Gets detailed information about a specific facility (KIPU location)
 */
export async function GET(request: NextRequest) {
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
    
    // Extract facility_id from URL path
    const urlParts = request.nextUrl.pathname.split('/');
    const facility_id = urlParts[urlParts.length - 1];
    
    if (!facility_id || facility_id === '[facility_id]') {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }
    
    // Get facility from service
    const facility = await getFacility(facility_id);
    
    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }
    
    // Add caching headers (15 minutes)
    return NextResponse.json(facility, {
      headers: {
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error in facility detail endpoint:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}