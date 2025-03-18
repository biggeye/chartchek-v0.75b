import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatient } from '@/lib/kipu/service/patient-service';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

/**
 * GET handler for retrieving a specific patient's details
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including facilityId and patientId
 * @returns NextResponse with the patient details or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { facilityId: string; patientId: string } }
) {
  try {
    const { facilityId, patientId } = params;

    console.log(`Patient details API - Fetching patient: ${patientId} from facility: ${facilityId}`);

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

    // Call KIPU API to get patient details
    const response = await kipuGetPatient(patientId, facilityId, credentials);
    
    console.log('Patient details API - KIPU API Response:', {
      success: response.success,
      hasData: !!response.data,
      errorCode: response.error?.code,
      errorMessage: response.error?.message
    });
    
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Map KIPU patient to our format
    try {
      const patient = mapKipuPatientToPatientBasicInfo(response.data.patient);
      
      console.log(`Patient details API - Successfully mapped patient: ${patient.first_name} ${patient.last_name}`);
      
      // Return patient with caching headers
      return NextResponse.json(patient, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
          'Vary': 'Authorization'
        }
      });
    } catch (error) {
      console.error(`Error mapping patient ${patientId}:`, error);
      return NextResponse.json(
        { error: 'Failed to map patient data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/kipu/facilities/[facilityId]/patients/[patientId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
