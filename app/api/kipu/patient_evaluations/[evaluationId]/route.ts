import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';
import { kipuGetPatientEvaluation } from '@/lib/kipu/service/evaluation-service';
import { KipuEvaluation, KipuPatientEvaluation, KipuPatientEvaluationItem } from '@/types/kipu';
import { redis, getCachedData, cacheKeys, cacheTTL } from '@/utils/cache/redis';

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
        
        // Map KIPU evaluation data to our KipuPatientEvaluation interface
        const patientEvaluation: KipuPatientEvaluation = {
          id: kipuData.id,
          name: kipuData.name || 'Evaluation',
          patientId: kipuData.patient_id,
          status: kipuData.status,
          evaluationType: kipuData.evaluation_type,
          createdAt: kipuData.created_at,
          updatedAt: kipuData.updated_at,
          createdBy: kipuData.created_by || '',
          evaluationContent: kipuData.evaluation_content || '',
          evaluationItems: kipuData.patient_evaluation_items as KipuPatientEvaluationItem[],
          patientCasefileId: kipuData.patient_casefile_id,
          billable: kipuData.billable,
          placeOfService: kipuData.place_of_service,
          billingCodes: kipuData.billing_codes,
          requireSignature: kipuData.require_signature,
          requirePatientSignature: kipuData.require_patient_signature,
          requireGuarantorSignature: kipuData.require_guarantor_signature,
          requireGuardianSignature: kipuData.require_guardian_signature,
          availableOnPortal: kipuData.available_on_portal,
          isCrm: kipuData.is_crm,
          masterTreatmentPlanCategory: kipuData.master_treatment_plan_category,
          forceAllReviewUsersTitles: kipuData.force_all_review_users_titles,
          forceAllStaffUsersTitles: kipuData.force_all_staff_users_titles,
          reviewSignatureUserTitles: kipuData.review_signature_user_titles,
          signatureUserTitles: kipuData.signature_user_titles,
          locked: kipuData.locked,
          isRequired: kipuData.is_required,
          evaluationVersionId: kipuData.evaluation_version_id,
          ancillary: kipuData.ancillary,
          billableClaimFormat: kipuData.billable_claim_format,
          rendering_provider: kipuData.rendering_provider,
          evaluationId: kipuData.evaluation_id,
          patientProcessId: kipuData.patient_process_id,
          updatedBy: kipuData.updated_by,
        };
        
        return patientEvaluation;
      },
      cacheTTL.MEDIUM // 5 minutes
    );
    // Return the evaluation data
    return NextResponse.json(evaluation);
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