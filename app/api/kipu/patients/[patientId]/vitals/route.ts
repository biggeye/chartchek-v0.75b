import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatientVitalSigns } from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

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
    const { patientId } = params;
    const url = new URL(req.url);
    const facilityId = url.searchParams.get('facilityId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    console.log(`Patient vital signs API - Fetching vital signs for patient: ${patientId} from facility: ${facilityId}`);

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

    // Make direct KIPU API call to get patient vital signs
    // The patientId is passed directly to the service function which will handle the proper formatting
    const response = await kipuGetPatientVitalSigns(
      patientId,
      facilityId,
      credentials,
      page,
      limit
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch vital signs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vital_signs: response.data?.vital_signs || [],
      pagination: response.data?.pagination || {
        current_page: page.toString(),
        total_pages: '1',
        records_per_page: limit.toString(),
        total_records: '0'
      }
    });
  } catch (error) {
    console.error('Error in patient vital signs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient vital signs' },
      { status: 500 }
    );
  }
}
