import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { KipuPatientEvaluationsResponse } from '@/types/kipu/evaluations';
import { snakeToCamel } from '@/utils/case-converters';
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

    // Create Supabase client
    const supabase = await createServer();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (evaluationId) queryParams.append('evaluation_id', evaluationId);
    if (completedOnly) queryParams.append('completed_only', 'true');
    if (currentCensusOnly) queryParams.append('current_census_only', 'true');
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (includeStranded) queryParams.append('include_stranded', 'true');
    queryParams.append('page', page);
    queryParams.append('per', per);
    if (patientProcessId) queryParams.append('patient_process_id', patientProcessId);
    if (evaluationContent) queryParams.append('evaluation_content', evaluationContent);

    // Call KIPU API using the standard utility
    const endpoint = `/api/patient_evaluations?${queryParams.toString()}`;
    const response = await kipuServerGet<KipuPatientEvaluationsResponse>(endpoint);
    
    if (!response.success || !response.data) {
      console.error('Failed to fetch patient evaluations from KIPU:', response.error);
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch evaluations from KIPU' },
        { status: response.error?.code ? parseInt(response.error.code) : 500 }
      );
    }
    
    // Map KIPU evaluations to our format if needed
    const evaluations = response.data.patient_evaluations || [];
    const camelCaseEvaluationsData = snakeToCamel(evaluations);

    const pagination = response.data.pagination || {
      current_page: '1',
      total_pages: '1',
      records_per_page: '20',
      total_records: '0'
    };

    // Return the evaluations and pagination info
    return NextResponse.json({
      evaluations: camelCaseEvaluationsData,
      pagination: {
        page: parseInt(pagination.current_page),
        pages: parseInt(pagination.total_pages),
        limit: parseInt(pagination.records_per_page),
        total: parseInt(pagination.total_records)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/kipu/patient_evaluations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}