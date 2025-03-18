import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { 
  kipuGetPatientEvaluations, 
  kipuCreatePatientEvaluation,
  mapKipuEvaluationToPatientEvaluation 
} from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    
    // Get facilityId from search params
    const searchParams = req.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    
    console.log(`[KIPU DEBUG] API Route - Getting evaluations for patient ID: ${patientId}, facility ID: ${facilityId}`);
    console.log(`[KIPU DEBUG] API Route - Request URL: ${req.nextUrl.toString()}`);
    console.log(`[KIPU DEBUG] API Route - Request headers:`, Object.fromEntries([...req.headers.entries()]));

    if (!facilityId) {
      console.error(`[KIPU DEBUG] API Route - Missing facilityId parameter`);
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
      console.error(`[KIPU DEBUG] API Route - Unauthorized: No user found`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[KIPU DEBUG] API Route - Authenticated user: ${user.id}, email: ${user.email}`);

    // Get KIPU API credentials
    const credentials = await getKipuCredentials();
    
    if (!credentials) {
      console.error(`[KIPU DEBUG] API Route - No API credentials found for user ${user.id}`);
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }

    console.log(`[KIPU DEBUG] API Route - Retrieved KIPU credentials for user ${user.id}`);
    console.log(`[KIPU DEBUG] API Route - Base URL: ${credentials.baseUrl}, App ID: ${credentials.appId}`);

    // We no longer need to decode the patient ID here as the service function handles it
    console.log(`[KIPU DEBUG] API Route - Calling service function with patient ID: ${patientId}`);

    // Call KIPU API to get patient evaluations
    const response = await kipuGetPatientEvaluations(patientId, facilityId, credentials);
    
    console.log(`[KIPU DEBUG] API Route - Service function returned:`, {
      success: response.success,
      hasError: !!response.error,
      errorCode: response.error?.code,
      errorMessage: response.error?.message,
      hasData: !!response.data,
      evaluationsPresent: !!response.data?.evaluations,
      evaluationsCount: response.data?.evaluations?.length || 0
    });
    
    if (!response.success || !response.data) {
      console.error('[KIPU DEBUG] API Route - Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    console.log('[KIPU DEBUG] API Route - Successfully fetched patient evaluations from KIPU API');
    
    // Map KIPU evaluations to our format
    const evaluationsData = response.data.evaluations || [];
    console.log(`[KIPU DEBUG] API Route - Raw evaluations data count: ${evaluationsData.length}`);
    
    if (evaluationsData.length === 0) {
      console.log('[KIPU DEBUG] API Route - No evaluations found for this patient. This may be expected if the patient has no evaluations.');
    } else {
      console.log(`[KIPU DEBUG] API Route - First evaluation data keys: ${Object.keys(evaluationsData[0]).join(', ')}`);
    }
    
    const evaluations = evaluationsData.map(mapKipuEvaluationToPatientEvaluation);
    console.log(`[KIPU DEBUG] API Route - Mapped evaluations count: ${evaluations.length}`);
    
    // Return evaluations with pagination info
    return NextResponse.json({
      evaluations,
      pagination: {
        total: evaluationsData.length,
        page: 1,
        limit: evaluationsData.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('[KIPU DEBUG] API Route - Error in GET /api/kipu/patients/[patientId]/evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new patient evaluation
 * 
 * @param req - The incoming request with evaluation data
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the created evaluation or an error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params;
    const evaluationData = await req.json();
    
    // Get facilityId from search params
    const searchParams = req.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    
    console.log(`API - Creating evaluation for patient ID: ${patientId}, facility ID: ${facilityId}`);

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

    // We no longer need to decode the patient ID here as the service function handles it
    console.log(`API - Calling service function with patient ID: ${patientId}`);

    // Add facilityId to evaluation data if not already present
    if (!evaluationData.facilityId && !evaluationData.locationId) {
      evaluationData.locationId = facilityId;
    }

    // Call KIPU API to create patient evaluation
    const response = await kipuCreatePatientEvaluation(
      patientId,
      evaluationData,
      credentials
    );
    
    if (!response.success || !response.data) {
      console.error('Failed to create patient evaluation in KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to create evaluation in KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU evaluation to our format
    const evaluation = mapKipuEvaluationToPatientEvaluation(response.data.evaluation);
    
    // Return created evaluation
    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/kipu/patients/[patientId]/evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
