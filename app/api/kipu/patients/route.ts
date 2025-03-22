import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');



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

    // Call KIPU API to list patients
    const response = await kipuServerGet<{ patients?: any[] }>(`/api/patients/census`, credentials);

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

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPatients = patients.slice(startIndex, endIndex);
    // Return paginated response
    return NextResponse.json({
      patients: paginatedPatients,
      pagination: {
        total: patients.length, // Use the full array length for total count
        page,
        limit,
        pages: Math.ceil(patients.length / limit) // Calculate pages based on total items
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
