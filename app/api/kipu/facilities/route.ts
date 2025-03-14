import { NextRequest, NextResponse } from 'next/server';
import { listFacilities } from '@/lib/kipu/service/facility-service';
import { createServer } from '@/utils/supabase/server';

/**
 * GET /api/kipu/facilities
 * Lists all facilities (KIPU locations) available to the authenticated user
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.has('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit') as string, 10) : 20;
    const status = searchParams.get('status') as 'active' | 'inactive' | 'all' || 'active';
    const sort = searchParams.get('sort') as 'name_asc' | 'name_desc' | 'created_at_asc' | 'created_at_desc' || 'name_asc';
    
    // Validate parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be between 1 and 100)' },
        { status: 400 }
      );
    }
    
    if (status && !['active', 'inactive', 'all'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter (must be active, inactive, or all)' },
        { status: 400 }
      );
    }
    
    if (sort && !['name_asc', 'name_desc', 'created_at_asc', 'created_at_desc'].includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter' },
        { status: 400 }
      );
    }
    
    // Get facilities from service
    const response = await listFacilities({
      page,
      limit,
      status,
      sort
    });
    
    // Add caching headers (15 minutes)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error in facilities endpoint:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}