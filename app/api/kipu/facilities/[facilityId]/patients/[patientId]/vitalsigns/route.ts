import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getPatientVitalSigns } from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

/**
 * GET handler for retrieving a patient's vital signs
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including facilityId and patientId
 * @returns NextResponse with the patient vital signs or an error
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

    // For now, use the existing getPatientVitalSigns function
    // In the future, this should be updated to use a direct KIPU API call
    const vitalSigns = await getPatientVitalSigns(facilityId, patientId, page, limit);
    
    console.log(`Patient vital signs API - Retrieved ${vitalSigns.length} vital signs`);
    
    // Return vital signs with caching headers
    return NextResponse.json({
      vitalSigns,
      pagination: {
        total: vitalSigns.length,
        page,
        limit,
        pages: Math.ceil(vitalSigns.length / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'Vary': 'Authorization'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/facilities/[facilityId]/patients/[patientId]/vitalsigns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
