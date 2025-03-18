/**
 * KIPU API Test Endpoint
 * 
 * This endpoint tests the KIPU API integration by making a simple request
 * to verify that our signature generation is working correctly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

export async function GET(request: NextRequest) {
  try {
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

    // Make a test request to the KIPU API - we'll use the locations endpoint
    // Note: In KIPU API, "locations" correspond to our "facilities"
    const response = await kipuServerGet('/api/locations', credentials);

    return NextResponse.json({
      success: true,
      message: 'KIPU API test completed',
      credentials: maskedCredentials,
      apiResponse: response
    });
  } catch (error) {
    console.error('Error testing KIPU API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
