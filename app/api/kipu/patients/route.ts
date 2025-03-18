import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuListPatients } from '@/lib/kipu/service/patient-service';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { PatientBasicInfo } from '@/lib/kipu/types';
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
    const facilityId = url.searchParams.get('facilityId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'active';

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

 
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
    const response = await kipuServerGet<{ patients?: any[] }>(`/api/patients/census?location_id=${facilityId}`, credentials);
    
    console.log('Patient API Route - KIPU API Response:', {
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
    console.log('Patient API Route - Data Structure:', {
      hasPatients: !!response.data.patients,
      patientsIsArray: Array.isArray(response.data.patients),
      patientCount: Array.isArray(response.data.patients) ? response.data.patients.length : 'N/A'
    });

    // Map KIPU patients to our format
    const patients = response.data.patients?.map((patient: any) => {
      const mappedPatient = mapKipuPatientToPatientBasicInfo(patient);
      console.log(`Mapped patient ${patient.id || patient.patient_id}: ${mappedPatient.first_name} ${mappedPatient.last_name}`);
      return mappedPatient;
    }) || [];
    
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
    
    // Return paginated response
    return NextResponse.json({
      patients: paginatedPatients,
      pagination: {
        total: filteredPatients.length,
        page,
        limit,
        pages: Math.ceil(filteredPatients.length / limit)
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
