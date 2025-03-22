import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import {
  kipuGetPatientEvaluations,
} from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

// Add this near the top of the file, after the imports
interface KipuEvaluationResponse {
  pagination: {
    current_page: number;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  patient_evaluations: any[]; // Using 'any' for now, ideally should match the KipuEvaluation type
}
// Then update the line with the error:

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
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error(`[KIPU DEBUG] API Route - Unauthorized: No user found`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
 
    const credentials = await getKipuCredentials();
    if (!credentials) {
      console.error(`[KIPU DEBUG] API Route - No API credentials found for user ${user.id}`);
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }

    const response = await kipuGetPatientEvaluations(patientId, credentials);

    // Add console log to display raw response
    console.log('[KIPU DEBUG] Raw evaluations response:', JSON.stringify(response, null, 2));
    
    if (!response.success || !response.data) {
      console.error('[KIPU DEBUG] API Route - Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }
    if (!response.success || !response.data) {
      console.error('[KIPU DEBUG] API Route - Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }
    const evaluationsData = (response.data as KipuEvaluationResponse).patient_evaluations || []; const evaluations = Array.isArray(evaluationsData) ? evaluationsData : [];
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