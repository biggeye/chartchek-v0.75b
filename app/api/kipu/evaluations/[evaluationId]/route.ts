import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { 
  kipuGetPatientEvaluation,
  mapKipuEvaluationToPatientEvaluation 
} from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

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
    
    // Get facilityId from search params
    const searchParams = req.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    
    console.log(`API - Getting evaluation ID: ${evaluationId}, facility ID: ${facilityId}`);

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Missing facilityId parameter' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServer();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get KIPU API credentials
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }

    console.log(`API - Calling service function with evaluation ID: ${evaluationId}`);

    // Call KIPU API to get patient evaluation
    const response = await kipuGetPatientEvaluation(evaluationId, facilityId, credentials);
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch patient evaluation from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch evaluation from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    console.log('Successfully fetched patient evaluation from KIPU API');
    
    // Map KIPU evaluation to our format
    const evaluation = mapKipuEvaluationToPatientEvaluation(response.data.evaluation);
    
    // Return evaluation
    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error in GET /api/kipu/evaluations/[evaluationId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
