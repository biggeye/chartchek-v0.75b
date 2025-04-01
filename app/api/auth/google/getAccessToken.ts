// lib/google/getAccessToken.ts
import { createServer } from '@/utils/supabase/server';
import { refreshAccessToken } from './auth';

export async function getGoogleAccessToken() {
  const supabase = await createServer();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No session');
  }
  
  // Get user data
  const { data: userData } = await supabase.auth.admin.getUserById(session.user.id);
  if (!userData) {
    throw new Error('User not found');
  }
  
  const { 
    google_access_token: accessToken,
    google_refresh_token: refreshToken,
    google_token_expiry: tokenExpiry
  } = userData.user_metadata || {};
  
  // Check if we have tokens
  if (!accessToken || !refreshToken) {
    throw new Error('No Google tokens found');
  }
  
  // Check if token is expired
  if (Date.now() >= tokenExpiry) {
    try {
      // Refresh the token
      const tokens = await refreshAccessToken(refreshToken);
      
      // Update tokens in user metadata
      await supabase.auth.admin.updateUserById(session.user.id, {
        user_metadata: {
          ...userData.user_metadata,
          google_access_token: tokens.access_token,
          google_token_expiry: Date.now() + (tokens.expires_in * 1000)
        }
      });
      
      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }
  
  // Return the current token
  return accessToken;
}