import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatient } from '@/lib/kipu/service/patient-service';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

/**
 * GET handler for retrieving a specific patient's details
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the patient details or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const credentials = await getKipuCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }
    
    // Get patientId from params
    const patientId = params.patientId;
    
    // Get facilityId from query parameters
    const searchParams = req.nextUrl.searchParams;


    const response = await kipuGetPatient<{patient: any}>(patientId, credentials);
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch patient from KIPU:', response.error);
      
      // Ensure we have a valid status code (between 200-599)
      let statusCode = 500;
      if (response.error?.code) {
        const parsedCode = parseInt(response.error.code);
        // Only use the parsed code if it's a valid HTTP status code
        if (!isNaN(parsedCode) && parsedCode >= 200 && parsedCode <= 599) {
          statusCode = parsedCode;
        }
      }
      
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patient from KIPU' },
        { status: statusCode }
      );
    }
    
    // Map KIPU patient to our format
    const patientData = response.data.patient || response.data;
    const patient = mapKipuPatientToPatientBasicInfo(patientData);
    
    // Return patient details directly
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error in GET /api/kipu/patients/[patientId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}