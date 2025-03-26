import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import {
  kipuGetPatientEvaluations,
} from '@/lib/kipu/service/patient-evaluation-service';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';
import { parsePatientId } from '@/lib/kipu/auth/config';

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

/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(
  req: NextRequest,
  context: { params: { patientId: string } }
) {

  try {

    const params = await Promise.resolve(context.params);
    const encodedPatientId = params.patientId;

    // Decode and parse the patient ID to get chartId and patientMasterId components
    const decodedPatientId = decodeURIComponent(encodedPatientId);
   
    
    // Parse the patient ID to ensure it's in the correct format
    try {
      const { chartId, patientMasterId } = parsePatientId(decodedPatientId);
      
      if (!chartId || !patientMasterId) {
        console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Invalid patient ID format: ${decodedPatientId}`);
        return NextResponse.json(
          { error: 'Invalid patient ID format. Expected format: chartId:patientMasterId' },
          { status: 400 }
        );
      }
    
      const supabase = await createServer();
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id;
  
      if (!user) {
        console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Unauthorized: No user found`);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
 
      const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);
      if (!credentials) {
        console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - No API credentials found for user`);
        return NextResponse.json(
          { error: 'No API credentials found for this user' },
          { status: 404 }
        );
      }

      const response = await kipuGetPatientEvaluations(decodedPatientId, credentials);
      console.log('[api] kipuGetPatientEvaluations: ', response);
        if (!response.success || !response.data) {
        console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Failed to fetch patient evaluations from KIPU: ${response.error?.message || 'Unknown error'}`);
        return NextResponse.json(
          { error: response.error?.message || 'Failed to fetch patient evaluations from KIPU' },
          { status: response.error?.code ? parseInt(response.error.code) : 500 }
        );
      }

      let evaluations = [];
      try {
        const responseData = response.data as KipuEvaluationResponse;

        if (responseData.patient_evaluations && Array.isArray(responseData.patient_evaluations)) {
          evaluations = responseData.patient_evaluations;
        } else {
          // Log the unexpected response structure for debugging
          console.warn(`[/api/kipu/patients/[patientId]/evaluations] API Route - Unexpected response structure: ${responseData.patient_evaluations ? 'patient_evaluations is not an array' : 'patient_evaluations is missing'}`);
          console.debug('Response data structure:', JSON.stringify(responseData));
        }
      } catch (err) {
        console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Error parsing evaluations data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      // Prepare response data
      const responseData = {
        evaluations,
      
      };
      
      return NextResponse.json(responseData);
    } catch (error) {
      console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Error in GET /api/kipu/patients/[patientId]/evaluations: ${error instanceof Error ? error.message : 'Internal server error'}`);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[/api/kipu/patients/[patientId]/evaluations] API Route - Error in GET /api/kipu/patients/[patientId]/evaluations: ${error instanceof Error ? error.message : 'Internal server error'}`);
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