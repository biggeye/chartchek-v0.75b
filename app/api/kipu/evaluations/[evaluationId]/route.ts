import { NextRequest, NextResponse } from 'next/server';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';
import { KipuApiResponse } from '@/types/chartChek/kipuAdapter';
import { kipuServerGet } from '@/lib/kipu/auth/server';
import { createServer } from '@/utils/supabase/server';
/**
 * GET /api/kipu/evaluations/[evaluationId]
 * 
 * Retrieves a specific evaluation template from KIPU by ID
 * This endpoint returns the complete template definition including all fields,
 * which can be used to render forms or map to ChartChek templates.
 */
export async function GET(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const templateId = params.evaluationId;
    const supabase = await createServer();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('🔍 KIPU Single Evaluation Request:', { templateId });
  
    // Get user ID for cache key
    const userId = session.user.id;
    // Get KIPU credentials
    const credentials = await serverLoadKipuCredentialsFromSupabase(userId);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'KIPU API credentials not found' },
        { status: 404 }
      );
    }
    
    // Construct KIPU API URL path
    const apiPath = `api/evaluations/${templateId}`;
    
    // Make request to KIPU API using helper function
    const response = await kipuServerGet(apiPath, credentials);
    console.log('[/api/kipu/evaluations/[evaluationId]] response:', response);
    if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to fetch evaluation template from KIPU', details: response.error },
        { status: 400 }
      );
    }
// app/api/kipu/evaluations/[evaluationId]/route.ts
// Fix for the type errors in the console logging section

// Replace the problematic console.log with this:
// Fix the console.log to remove statusCode reference
console.log('🔍 KIPU Single Evaluation Response:', {
  success: response.success,
  // Remove the statusCode line completely
  dataStructure: response.data ? {
    // Type assertion to handle 'unknown' type
    keys: Object.keys(response.data as Record<string, any>),
    nestedKeys: Object.keys(response.data as Record<string, any>).reduce((acc, key) => {
      const data = response.data as Record<string, any>;
      acc[key] = typeof data[key] === 'object' ? 
        (data[key] ? Object.keys(data[key]) : 'null') : 
        typeof data[key];
      return acc;
    }, {} as Record<string, any>),
    sampleData: JSON.stringify(response.data).substring(0, 1000) + '...'
  } : 'no data'
});
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ KIPU Single Evaluation Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KIPU evaluation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}