import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { getKipuCredentials } from '@/lib/kipu/service/user-settings';
import { kipuGetPatientEvaluation } from '@/lib/kipu/service/evaluation-service';
import { KipuEvaluation, KipuPatientEvaluation } from '@/types/kipu';

/**
 * GET handler for retrieving a specific patient evaluation by ID
 * 
 * @param req - The incoming request
 * @param context - The route context, including params with evaluationId
 * @returns NextResponse with the evaluation or an error
 */
// Fix for route.ts
export async function GET(
  req: NextRequest,
  context: { params: { patientId: string, evaluationId: string } }
) {
  try {
    // Await the params object before destructuring
    const params = await Promise.resolve(context.params);
    const { evaluationId } = params;

    if (!evaluationId || isNaN(Number(evaluationId))) {
      return NextResponse.json(
        { error: 'Invalid evaluation ID' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServer();

    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID for cache key
    const ownerId = session.user.id;

    // Get KIPU API credentials for the current user
    const kipuCredentials = await getKipuCredentials(ownerId);
    if (!kipuCredentials) {
      throw new Error('KIPU API credentials not found');
    }

    // Include settings to get more details
    const response = await kipuGetPatientEvaluation<any>(evaluationId, kipuCredentials, true);
    if (!response.success) {
      // Check if this is a 404 Not Found error from KIPU
      if (response.error?.code === '404' ||
        (response.error?.details &&
          typeof response.error.details === 'object' &&
          'error' in response.error.details &&
          typeof response.error.details.error === 'string' &&
          response.error.details.error.includes('not found'))) {

        // Create a custom error with a specific code to identify 404 errors
        const notFoundError = new Error(`Evaluation not found: ${evaluationId}`);
        // @ts-ignore - Adding custom property to Error
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      throw new Error(`Failed to fetch evaluation from KIPU API: ${response.error?.message || 'Unknown error'}`);
    }

    // Transform the KIPU evaluation data to our KipuPatientEvaluation format
    const kipuData = response.data;

    if (!kipuData) {
      const notFoundError = new Error(`No evaluation data returned from KIPU API`);
      // @ts-ignore - Adding custom property to Error
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    // Return the evaluation data
    return NextResponse.json({
      success: true,
      data: kipuData
    });
    
  } catch (error) {
    console.error('Error fetching evaluation:', error);

    // Check if this is a 404 Not Found error
    // @ts-ignore - Checking for custom property on Error
    if (error instanceof Error && error.statusCode === 404) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evaluation not found',
          message: error.message
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
