import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { PatientBasicInfo } from '@/types/kipu';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';

/**
 * GET handler for listing patients in a facility
 * 
 * @param req - The incoming request
 * @returns NextResponse with the list of patients or an error
 */
export async function GET(
  req: NextRequest,
) {
  try {
    const url = new URL(req.url);



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
    const ownerId = user?.id;

    // Get KIPU API credentials
    const credentials = await getKipuCredentials(ownerId);

    if (!credentials) {
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }

    // Call KIPU API to list patients
    const response = await kipuServerGet<{ patients?: any[] }>(
      `/api/patients/admissions?start_date=2000-01-01&end_date=2025-04-01`, 
      credentials
    );

   if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patients from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }
    // Map KIPU patients to our format
    const patients = response.data?.patients?.map((patient: any) => {
      const mappedPatient = mapKipuPatientToPatientBasicInfo(patient);
      return mappedPatient;
    }) || [];

    // Return all patients without pagination
    const result = JSON.stringify({
      success: true,
      data: {
        patients: patients,
        total: patients.length
      }
    });

    return new NextResponse(result, { headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
