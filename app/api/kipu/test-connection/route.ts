/**
 * KIPU Test Connection API Route
 * 
 * This API route tests the connection to the KIPU EMR API using the stored credentials.
 * It attempts to make a simple API call to verify that the credentials are valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';

/**
 * GET handler for testing KIPU API connection
 */
export async function GET(request: NextRequest) {
  try {
    // Get the facility ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    // Get the KIPU credentials for the current user
    const credentials = await getKipuCredentials();

    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU credentials not configured. Please configure your API settings first.' },
        { status: 400 }
      );
    }

    // Make a test request to the KIPU API using the kipuServerGet helper
    // We'll use the locations endpoint which corresponds to our facilities
    const response = await kipuServerGet('/api/locations', credentials);

    // Check if the request was successful
    if (response.success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to KIPU API'
      });
    } else {
      // Return the error details from the API response
      return NextResponse.json({
        error: `Failed to connect to KIPU API: ${response.error?.code || 'Unknown error'}`,
        details: response.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing KIPU connection:', error);
    return NextResponse.json({
      error: 'An error occurred while testing the KIPU connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
