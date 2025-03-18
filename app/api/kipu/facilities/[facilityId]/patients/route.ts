import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuListPatients } from '@/lib/kipu/service/patient-service';
import { mapKipuPatientToPatientBasicInfo } from '@/lib/kipu/mapping';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { PatientBasicInfo } from '@/lib/kipu/types';

/**
 * GET handler for listing patients in a specific facility
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including facilityId
 * @returns NextResponse with the list of patients or an error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { facilityId: string } }
) {
  try {
    const { facilityId } = params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'active';

    console.log(`Facility-specific patients API - Fetching patients for facility: ${facilityId}`);

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
    // Note: In KIPU API, facilities are called "locations"
    const response = await kipuListPatients(credentials, facilityId);
    
    console.log('Facility-specific patients API - KIPU API Response:', {
      success: response.success,
      hasData: !!response.data,
      errorCode: response.error?.code,
      errorMessage: response.error?.message
    });
    
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch patients from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    // Log the raw data structure to understand the format
    console.log('Facility-specific patients API - Data Structure:', {
      hasPatients: !!response.data.patients,
      patientsIsArray: Array.isArray(response.data.patients),
      patientCount: Array.isArray(response.data.patients) ? response.data.patients.length : 'N/A'
    });

    // Map KIPU patients to our format
    const patients = response.data.patients?.map((patient: any) => {
      try {
        const mappedPatient = mapKipuPatientToPatientBasicInfo(patient);
        console.log(`Mapped patient ${patient.id || patient.patient_id}: ${mappedPatient.first_name} ${mappedPatient.last_name}`);
        return mappedPatient;
      } catch (error) {
        console.error(`Error mapping patient ${patient.id || patient.patient_id}:`, error);
        return null;
      }
    }).filter(Boolean) || [];
    
    // Filter patients by status if needed
    const filteredPatients = status === 'all' 
      ? patients 
      : patients.filter((p: PatientBasicInfo) => {
          if (status === 'active') {
            return !p.discharge_date;
          } else if (status === 'inactive') {
            return !!p.discharge_date;
          }
          return true;
        });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    
    // Return paginated response with caching headers
    return NextResponse.json({
      patients: paginatedPatients,
      pagination: {
        total: filteredPatients.length,
        page,
        limit,
        pages: Math.ceil(filteredPatients.length / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'Vary': 'Authorization'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/facilities/[facilityId]/patients:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
