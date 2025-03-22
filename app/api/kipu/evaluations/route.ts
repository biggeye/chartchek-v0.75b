import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-api-settings';
import { createKipuRequestConfig } from '@/lib/kipu/auth/signature';
import { KipuApiResponse, KipuCredentials } from '@/types/kipu';

/**
 * GET handler for retrieving patient evaluations
 * 
 * @param req - The incoming request
 * @returns NextResponse with the evaluations or an error
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    
    // Optional query parameters
    const evaluationId = searchParams.get('evaluation_id');
    const completedOnly = searchParams.get('completed_only') === 'true';
    const currentCensusOnly = searchParams.get('current_census_only') === 'true';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeStranded = searchParams.get('include_stranded') === 'true';
    const page = searchParams.get('page') || '1';
    const per = searchParams.get('per') || '20';
    const patientProcessId = searchParams.get('patient_process_id');
    const evaluationContent = searchParams.get('evaluation_content');
    
    console.log(`API - Getting all patient evaluations`, {
      evaluationId,
      completedOnly,
      currentCensusOnly,
      startDate,
      endDate,
      includeStranded,
      page,
      per,
      patientProcessId,
      evaluationContent
    });


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

    // Call KIPU API to get patient evaluations
    const response = await kipuListEvaluations(
      credentials,
      {
        evaluation_id: evaluationId,
        completed_only: completedOnly,
        current_census_only: currentCensusOnly,
        start_date: startDate,
        end_date: endDate,
        include_stranded: includeStranded,
        page,
        per,
        patient_process_id: patientProcessId,
        evaluation_content: evaluationContent
      }
    );
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }

    console.log('Successfully fetched patient evaluations from KIPU API');
    
    // Map KIPU evaluations to our format if needed
    const evaluations = response.data.patient_evaluations || [];
    const pagination = response.data.pagination || {
      current_page: '1',
      total_pages: '1',
      records_per_page: '20',
      total_records: '0'
    };
    
    // Return evaluations with pagination
    return NextResponse.json({
      evaluations,
      pagination: {
        page: parseInt(pagination.current_page),
        pages: parseInt(pagination.total_pages),
        limit: parseInt(pagination.records_per_page),
        total: parseInt(pagination.total_records)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Direct KIPU API call to list patient evaluations (server-side function)
 * 
 * @param credentials - KIPU API credentials
 * @param params - Query parameters for the KIPU API
 * @returns Promise resolving to the KIPU API response
 */
async function kipuListEvaluations(
  credentials: KipuCredentials,
  params: {
    evaluation_id?: string | null;
    completed_only?: boolean;
    current_census_only?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    include_stranded?: boolean;
    page?: string | null;
    per?: string | null;
    patient_process_id?: string | null;
    evaluation_content?: string | null;
  }
): Promise<KipuApiResponse> {
  try {
     
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('app_id', credentials.appId);
    
    // Add optional parameters if they exist
    if (params.evaluation_id) queryParams.append('evaluation_id', params.evaluation_id);
    if (params.completed_only) queryParams.append('completed_only', 'true');
    if (params.current_census_only) queryParams.append('current_census_only', 'true');
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.include_stranded) queryParams.append('include_stranded', 'true');
    if (params.page) queryParams.append('page', params.page);
    if (params.per) queryParams.append('per', params.per);
    if (params.patient_process_id) queryParams.append('patient_process_id', params.patient_process_id);
    if (params.evaluation_content) queryParams.append('evaluation_content', params.evaluation_content);
    
    // Construct the endpoint with query parameters
    const endpoint = `/api/patient_evaluations?${queryParams.toString()}`;
    
    // Create request configuration with authentication headers
    const requestConfig = createKipuRequestConfig('GET', endpoint, credentials);
    
    // Make the API call
    const response = await fetch(`${credentials.baseUrl}${endpoint}`, requestConfig);
    
    // Log the response status
    console.log(`KIPU API Response Status: ${response.status} ${response.statusText}`);
    
    // Parse the response
    let data;
    try {
      const text = await response.text();
      console.log(`KIPU API Raw Response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      if (text && text.trim()) {
        data = JSON.parse(text);
      } else {
        console.error('KIPU API returned empty response');
        data = {};
      }
    } catch (parseError) {
      console.error('Error parsing KIPU API response:', parseError);
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: `Failed to parse KIPU API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }
      };
    }
    
    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: !response.ok ? {
        code: response.status.toString(),
        message: data.error || 'Failed to get patient evaluations from KIPU API'
      } : undefined
    };
  } catch (error) {
    console.error(`Error in kipuListEvaluations:`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred'
      }
    };
  }
}