import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatientVitalSigns } from '@/lib/kipu/service/vitals-service';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';

/**
 * GET handler for retrieving a patient's vital signs
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the patient vital signs or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Access patientId directly from params object
    const patientId: string = params.patientId;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Create Supabase client and get user in parallel
    const [supabase, decodedPatientId] = await Promise.all([
      createServer(),
      Promise.resolve(decodeURIComponent(patientId))
    ]);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error(`[/api/kipu/patients/${patientId}/vitals] API Route - Unauthorized: No user found`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ownerId = user.id;

    // Get KIPU API credentials
    const credentials = await serverLoadKipuCredentialsFromSupabase(ownerId);

    if (!credentials) {
      console.error(`[/api/kipu/patients/${patientId}/vitals] API Route - No API credentials found for user`);
      return NextResponse.json(
        { success: false, error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }



    // Make direct KIPU API call to get patient vital signs
    const response = await kipuGetPatientVitalSigns(
      decodedPatientId,
      credentials,
      page,
      limit
    );

    if (!response.success || !response.data) {
      console.error(`[/api/kipu/patients/${patientId}/vitals] API Route - Failed to fetch patient vital signs from KIPU: ${response.error?.message || 'Unknown error'}`);
      return NextResponse.json(
        { success: false, error: response.error?.message || 'Failed to fetch vital signs' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Process and return the vital signs data with success flag
    return NextResponse.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error in GET /api/kipu/patients/[patientId]/vitals:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}