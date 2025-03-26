import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';
import { KipuApiResponse } from '@/types/kipu';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { createServer } from '@/utils/supabase/server';
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
    const supabase = await createServer();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID for cache key
    const userId = session.user.id;
    // Get KIPU credentials
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);
    
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