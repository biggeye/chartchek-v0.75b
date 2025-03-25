import { NextRequest, NextResponse } from 'next/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { KipuApiResponse } from '@/types/kipu';
import { kipuServerGet } from '@/lib/kipu/auth/server';

/**
 * GET /api/kipu/evaluations
 * 
 * Retrieves a list of evaluation templates from KIPU
 * These are the form templates used to create patient evaluations,
 * not the completed evaluation data itself.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    
    // Get KIPU credentials
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Add any additional search params from the original request
    searchParams.forEach((value, key) => {
      if (!['page', 'limit'].includes(key)) {
        queryParams.append(key, value);
      }
    });
    
    // Construct API path with query parameters
    const apiPath = `api/evaluations?${queryParams.toString()}`;
    
    // Make request to KIPU API using helper function
    const response = await kipuServerGet(apiPath, credentials);
     if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to fetch evaluation templates from KIPU', details: response.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Error fetching evaluation templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation templates', details: (error as Error).message },
      { status: 500 }
    );
  }
}