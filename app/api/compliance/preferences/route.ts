// app/api/compliance/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { complianceService } from '@/lib/compliance/complianceService';

// Get user's compliance framework preferences
export async function GET(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user preferences
    const userFrameworks = await complianceService.getUserFrameworks(user.id);
    
    // Format the response to be more frontend-friendly
    const preferences = userFrameworks.map(pref => ({
      id: pref.framework_id,
      name: pref.compliance_framework?.name || 'Unknown Framework',
      description: pref.compliance_framework?.description || '',
      is_active: pref.is_active
    }));
    
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching user compliance preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance preferences' },
      { status: 500 }
    );
  }
}

// Update user's compliance framework preferences
export async function PUT(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { frameworkIds, active } = body;
    
    if (!frameworkIds || !Array.isArray(frameworkIds)) {
      return NextResponse.json(
        { error: 'frameworkIds must be an array of framework IDs' },
        { status: 400 }
      );
    }
    
    // Update user preferences
    const result = await complianceService.updateUserPreferences(
      user.id,
      frameworkIds,
      active !== false // Default to true if not specified
    );
    
    return NextResponse.json({ 
      success: true,
      message: `Updated ${result.updated} and added ${result.added} framework preferences`,
      result
    });
  } catch (error) {
    console.error('Error updating user compliance preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance preferences' },
      { status: 500 }
    );
  }
}
