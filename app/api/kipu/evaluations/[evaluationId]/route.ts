import { NextRequest, NextResponse } from 'next/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { KipuApiResponse } from '@/types/kipu';
import { kipuServerGet } from '@/lib/kipu/auth/server';

/**
 * GET /api/kipu/evaluations/[evaluationId]
 * 
 * Retrieves a specific evaluation template from KIPU by ID
 * This endpoint returns the complete template definition including all fields,
 * which can be used to render forms or map to ChartChek templates.
 */
export async function GET(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const templateId = params.evaluationId;
    
    // Get KIPU credentials
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }
    
    // Construct KIPU API URL path
    const apiPath = `api/evaluations/${templateId}`;
    
    // Make request to KIPU API using helper function
    const response = await kipuServerGet(apiPath, credentials);
    console.log('[/api/kipu/evaluations/[evaluationId]] response:', response);
    if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to fetch evaluation template from KIPU', details: response.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('Error fetching evaluation template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation template', details: (error as Error).message },
      { status: 500 }
    );
  }
}