import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatientEvaluations, mapKipuEvaluationToPatientEvaluation } from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

/**
 * GET handler for retrieving a patient's evaluations
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including facilityId and patientId
 * @returns NextResponse with the patient evaluations or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { facilityId: string; patientId: string } }
) {
  try {
    const { facilityId, patientId } = params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    console.log(`Patient evaluations API - Fetching evaluations for patient: ${patientId} from facility: ${facilityId}`);

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

    // Call KIPU API to get patient evaluations
    const response = await kipuGetPatientEvaluations(patientId, facilityId, credentials);
    
    console.log('Patient evaluations API - KIPU API Response:', {
      success: response.success,
      hasData: !!response.data,
      errorCode: response.error?.code,
      errorMessage: response.error?.message
    });
    
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU evaluations to our format
    const evaluations = response.data.evaluations?.map((evaluation: any) => {
      try {
        return mapKipuEvaluationToPatientEvaluation(evaluation);
      } catch (error) {
        console.error(`Error mapping evaluation ${evaluation.id}:`, error);
        return null;
      }
    }).filter(Boolean) || [];
    
    console.log(`Patient evaluations API - Successfully mapped ${evaluations.length} evaluations`);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEvaluations = evaluations.slice(startIndex, endIndex);
    
    // Return evaluations with caching headers
    return NextResponse.json({
      evaluations: paginatedEvaluations,
      pagination: {
        total: evaluations.length,
        page,
        limit,
        pages: Math.ceil(evaluations.length / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'Vary': 'Authorization'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/facilities/[facilityId]/patients/[patientId]/evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
