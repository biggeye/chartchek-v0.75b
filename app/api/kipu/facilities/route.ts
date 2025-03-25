// app/api/kipu/facilities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kipuListFacilities } from '@/lib/kipu/service/facility-service';
import { createServer } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { KipuCredentials } from '@/types/kipu';

// Table name for API settings in Supabase
const API_SETTINGS_TABLE = 'user_api_settings';

/**
 * Loads KIPU API credentials from Supabase (server-side version)
 */
async function loadKipuCredentialsFromSupabaseServer(): Promise<KipuCredentials | null> {
  try {
    const supabase = await createServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.warn('Failed to load KIPU credentials from Supabase: User not authenticated');
      return null;
    }
    
    // Query the api_settings table for KIPU credentials
    const { data, error } = await supabase
      .from(API_SETTINGS_TABLE)
      .select('*')
      .eq('owner_id', user.id)
      .single();
    
    if (error || !data) {
      console.warn('Failed to load KIPU credentials from Supabase:', error?.message);
      return null;
    }
    
    // Map the database fields to our credentials interface
    return {
      accessId: data.access_id || '',
      secretKey: data.secret_key || '',
      appId: data.app_id || '',
      baseUrl: data.base_url || 'https://api.kipuapi.com'
    };
  } catch (error) {
    console.error('Error loading KIPU credentials from Supabase:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get credentials using server-side function
    const credentials = await loadKipuCredentialsFromSupabaseServer();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Unable to retrieve KIPU credentials' },
        { status: 401 }
      );
    }
    
    // Make KIPU API call with credentials
    const response = await kipuListFacilities(credentials);
    console.log('[api] kipuListFacilities response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}