import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuGetPatientOrders } from '@/lib/kipu/service/patient-service';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { PatientOrderQueryParams } from '@/types/kipu';

/**
 * GET handler for retrieving a patient's medication orders
 * 
 * @param req - The incoming request
 * @param params - The route parameters, including patientId
 * @returns NextResponse with the patient medication orders or an error
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
    
    // Extract query parameters for filtering
    const queryParams: Partial<PatientOrderQueryParams> = {
      page,
      per: limit
    };
    
    // Add optional filters if they exist in the request
    const status = url.searchParams.get('status');
    if (status && status !== 'all') {
      queryParams.status = status as any;
    }
    
    const medicationName = url.searchParams.get('medication_name');
    if (medicationName) {
      queryParams.medication_name = medicationName;
    }

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

    // Make direct KIPU API call to get patient medication orders
    const response = await kipuGetPatientOrders(
      decodeURIComponent(patientId),
      facilityId,
      credentials,
      queryParams
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch medication orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      patient_orders: response.data?.patient_orders || [],
      pagination: response.data?.pagination || {
        current_page: page.toString(),
        total_pages: '1',
        records_per_page: limit.toString(),
        total_records: '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patient medication orders' },
      { status: 500 }
    );
  }
}
