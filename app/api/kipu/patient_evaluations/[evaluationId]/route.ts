import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';
import { kipuGetPatientEvaluation } from '@/lib/kipu/service/patient-evaluation-service';
import { KipuEvaluation,KipuPatientEvaluation, KipuEvaluationItem} from '@/types/kipu/evaluations';
import { redis, getCachedData, cacheKeys, cacheTTL } from '@/utils/cache/redis';
import { snakeToCamel } from '@/utils/case-converters';
/**
 * GET handler for retrieving a specific patient evaluation by ID
 * 
 * @param req - The incoming request
 * @param context - The route context, including params with evaluationId
 * @returns NextResponse with the evaluation or an error
 */
export async function GET(
  req: NextRequest,
  context: { params: { evaluationId: string } }
) {
  try {
    // Await the params object before destructuring
    const params = await (context.params);
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
    const userId = session.user.id;
    
    // Create cache key
    const cacheKey = cacheKeys.evaluations.detail(userId, evaluationId);
    
    // Try to get from cache or fetch fresh data
    const evaluation = await getCachedData<any>(
      cacheKey,
      async () => {
        // Get KIPU API credentials for the current user
        const kipuCredentials = await serverLoadKipuCredentialsFromSupabase(userId);
        if (!kipuCredentials) {
          throw new Error('KIPU API credentials not found');
        }
    
        // Include settings to get more details
        const response = await kipuGetPatientEvaluation<any>(evaluationId, kipuCredentials, true);
        if (!response.data || !response.data.patient_evaluation) {
          throw new Error('No evaluation data returned from KIPU API');
        }
    
        // Transform the KIPU evaluation data to our KipuPatientEvaluation format
        const kipuData = response.data.patient_evaluation;
        const camelCaseEvaluationData = snakeToCamel(kipuData);
        console.log("Patient Evaluation Data: ", camelCaseEvaluationData);
        
        return camelCaseEvaluationData;
      },
      cacheTTL.MEDIUM // 5 minutes
    );
    const safeEvaluation = JSON.parse(JSON.stringify(evaluation));
    return NextResponse.json(safeEvaluation);
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