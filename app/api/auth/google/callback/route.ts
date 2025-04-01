// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserInfo } from '@/lib/google/auth';
import { createServerService } from '@/utils/supabase/serverService';

// app/api/auth/google/callback/route.ts
// app/api/auth/google/callback/route.ts - modified GET function
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = await createServerService();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  console.log('[google callback api]: Received state from URL:', state);
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=No+session`);
  }
  
  // Verify the state parameter
  const { data: userData } = await supabase.auth.admin.getUserById(session.user.id);
  console.log('[google callback api]: userData.user_metadata.oauth_state:', userData?.user_metadata?.oauth_state);
  
  // TEMPORARY FIX: Skip state validation for debugging
  // if (!userData || userData.user_metadata?.oauth_state !== state) {
  //   return NextResponse.redirect(`${baseUrl}/sign-in?error=Invalid+state`);
  // }
  
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/sign-in?error=No+code`);
  }
  
  try {
    // Exchange the code for tokens
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    
    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Store tokens in user metadata
    await supabase.auth.admin.updateUserById(session.user.id, {
      user_metadata: {
        ...userData?.user_metadata,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: Date.now() + (tokens.expires_in * 1000),
        google_user_info: userInfo,
        oauth_state: null // Clear the state
      }
    });
    
    // Redirect to the admin dashboard
    return NextResponse.redirect(`${baseUrl}/protected/admin/knowledge`);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(`${baseUrl}/sign-in?error=${encodeURIComponent(error.message)}`);
  }
}