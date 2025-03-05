// app/api/compliance/frameworks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { complianceService } from '@/lib/services/compliance/complianceService';

// Get all available frameworks
export async function GET(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeUserPreferences = searchParams.get('includeUserPreferences') === 'true';
    
    // Get all frameworks
    const frameworks = await complianceService.getAllFrameworks();
    
    // If requested, also get user preferences
    if (includeUserPreferences) {
      const userFrameworks = await complianceService.getUserFrameworks(user.id);
      
      // Create a map of user preferences to use for indicating active frameworks
      const userPrefsMap = userFrameworks.reduce((map, pref) => {
        map[pref.framework_id] = pref.is_active;
        return map;
      }, {} as Record<number, boolean>);
      
      // Enhance the framework data with user preference information
      const enhancedFrameworks = frameworks.map(framework => ({
        ...framework,
        is_active: userPrefsMap[framework.id] || false,
      }));
      
      return NextResponse.json({ frameworks: enhancedFrameworks });
    }
    
    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error('Error fetching compliance frameworks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance frameworks' },
      { status: 500 }
    );
  }
}

// Create a new framework (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin (you'll need to define this logic)
    const isAdmin = await checkUserIsAdmin(user.id);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Create the framework
    const framework = await complianceService.createFramework(name, description || '');
    
    return NextResponse.json({ framework }, { status: 201 });
  } catch (error) {
    console.error('Error creating compliance framework:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance framework' },
      { status: 500 }
    );
  }
}

// Helper function to check if user is admin (implement based on your app's logic)
async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createServer();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error in checkUserIsAdmin:', error);
    return false;
  }
}
