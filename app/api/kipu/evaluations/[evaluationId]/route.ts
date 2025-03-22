import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { kipuGetEvaluation } from '@/lib/kipu/service/patient-service';

/**
 * GET handler for retrieving a specific patient evaluation by ID
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including evaluationId
 * @returns NextResponse with the evaluation or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const { evaluationId } = params;
    
    // Get appId from search params
    const searchParams = req.nextUrl.searchParams;
    const appId = searchParams.get('app_id');
    
    if (!appId) {
      return NextResponse.json(
        { error: 'Missing required parameter: app_id' },
        { status: 400 }
      );
    }

    if (!evaluationId || isNaN(Number(evaluationId))) {
      return NextResponse.json(
        { error: 'Invalid evaluation ID' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServer();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get KIPU API credentials for the current user
    const kipuCredentials = await getKipuCredentials();
    if (!kipuCredentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }

    const response = await kipuGetEvaluation(evaluationId, kipuCredentials);

    if (!response.success) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch evaluation from KIPU API',
          details: response.error
        },
        { status: response.error?.code === 'not_found' ? 404 : 500 }
      );
    }

    // Return the evaluation data
    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}