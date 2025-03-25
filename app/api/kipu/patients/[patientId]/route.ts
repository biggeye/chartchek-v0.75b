import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatient } from '@/lib/kipu/service/patient-service';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { parsePatientId } from '@/lib/kipu/auth/config';

/**
 * GET handler for retrieving a specific patient's details
 * 
 * @param req - The incoming request
 * @param context - The route context, including params with patientId
 * @returns NextResponse with the patient details or an error
 */
export async function GET(
  req: NextRequest,
  context: { params: { patientId: string } }
) {
  try {
    // Await the params object before destructuring
    const params = await Promise.resolve(context.params);
    const patientId = params.patientId;
    
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const ownerId = user?.id;

    const credentials = await getKipuCredentials(ownerId);
    if (!credentials) {
      return NextResponse.json(
        { error: 'No API credentials found for this user' },
        { status: 404 }
      );
    }
    
    // Decode the patient ID before passing to the service
    const decodedPatientId = decodeURIComponent(patientId);
    
    // Parse the patient ID to get chartId and patientMasterId components
    const { chartId, patientMasterId } = parsePatientId(decodedPatientId);
    
    const response = await kipuGetPatient<{patient: any}>(decodedPatientId, credentials);
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
 // Map KIPU patient to our format
const patientData = response.data.patient || response.data;
const patient = mapKipuPatientToPatientBasicInfo(patientData);

// Return patient details in the format expected by patientStore
return NextResponse.json({
  success: true,
  data: patient
});
  } catch (error) {
    console.error('Error in GET /api/kipu/patients/[patientId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}