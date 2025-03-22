// use the following documentation to create a GET route here, following the patterns of /api/kipu/patients/route.ts ( a working endpoint utilizing kipuServerGet and getKipuCredentials for access to KIPU EMR API     )
// app/api/kipu/scheduer/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';

// Define the response interface
interface KipuAppointmentsResponse {
  pagination: {
    current_page: string;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  appointments: Array<{
    id: number;
    from: string;
    notes: string;
    to: string;
    group_session: boolean;
    telehealth_session: boolean;
    recurring: boolean;
    recurrence_end_date?: string;
    master_appointment_id?: number;
    group_session_occurrence_id?: number;
    appointment_type_id?: number;
    location: {
      id: number;
      name: string;
    };
    resources?: Array<{
      id: number;
      resource_id: string;
      telehealth_host: boolean;
      telehealth_alternate_host: boolean;
      name: string;
    }>;
    patients: Array<{
      id: number;
      patient_appointment_status: number;
      patient_id: number;
      patient_master_id: string;
      mr: string;
      name: string;
      telehealth_url?: string;
    }>;
    group_session_details?: {
      group_session_id: string;
      session_type: {
        id: number;
        name: string;
      };
      group_leaders: Array<{
        id: number;
        name: string;
      }>;
      topics: Array<{
        id: number;
        title: string;
        description: string;
      }>;
      enabled: boolean;
      title: string;
    };
  }>;
}

/**
 * GET handler for retrieving appointments
 * 
 * @param req - The incoming request
 * @returns NextResponse with the appointments or an error
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const facilityId = url.searchParams.get('facilityId');
    const page = url.searchParams.get('page') || '1';
    const per = url.searchParams.get('per') || '20';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const patientId = url.searchParams.get('patientId');
    const resourceId = url.searchParams.get('resourceId');
    const telehealthSessionOnly = url.searchParams.get('telehealthSessionOnly');
    const includeGroupSessions = url.searchParams.get('includeGroupSessions');
    const includeResources = url.searchParams.get('includeResources');
    const locationIds = url.searchParams.get('locationIds');
    const patientAppointmentStatusIds = url.searchParams.get('patientAppointmentStatusIds');
    const appointmentTypeIds = url.searchParams.get('appointmentTypeIds');

    if (!facilityId) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Get the supabase client
    const supabase = await createServer();
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the KIPU API credentials for the user
    const credentials = await getKipuCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('per', per);
    queryParams.append('start_date', startDate);
    
    if (endDate) queryParams.append('end_date', endDate);
    if (patientId) queryParams.append('patient_id', patientId);
    if (resourceId) queryParams.append('resource_id', resourceId);
    if (telehealthSessionOnly) queryParams.append('telehealth_session_only', telehealthSessionOnly);
    if (includeGroupSessions) queryParams.append('include_group_sessions', includeGroupSessions);
    if (includeResources) queryParams.append('include_resources', includeResources);
    
    // Handle array parameters
    if (locationIds) {
      const locations = locationIds.split(',');
      locations.forEach(id => queryParams.append('location_ids[]', id));
    }
    
    if (patientAppointmentStatusIds) {
      const statusIds = patientAppointmentStatusIds.split(',');
      statusIds.forEach(id => queryParams.append('patient_appointment_status_ids[]', id));
    }
    
    if (appointmentTypeIds) {
      const typeIds = appointmentTypeIds.split(',');
      typeIds.forEach(id => queryParams.append('appointment_type_ids[]', id));
    }

    // Make the request to KIPU API
    const response = await kipuServerGet<KipuAppointmentsResponse>(
      '/api/scheduler/appointments',
credentials
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}