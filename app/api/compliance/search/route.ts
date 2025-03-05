// app/api/compliance/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { complianceService } from '@/lib/services/compliance/complianceService';

export async function POST(request: NextRequest) {
  try {
    // Get the user from Supabase auth
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { query, frameworkIds, limit, threshold } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Search compliance data
    const results = await complianceService.searchCompliance({
      userId: user.id,
      query,
      frameworkIds,
      limit,
      threshold
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to search compliance data' },
      { status: 500 }
    );
  }
}
