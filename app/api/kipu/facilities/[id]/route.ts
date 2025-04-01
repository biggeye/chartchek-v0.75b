// app/api/kipu/statistics/[facilityId]/route.ts
import { NextResponse } from 'next/server';
import { createServer } from '@/utils/supabase/server';
import { KipuStatisticsService } from '@/lib/kipu/stats/statisticsService';
import { serverLoadKipuCredentialsFromSupabase } from '@/lib/kipu/auth/server';


export async function GET(
    request: Request,
    { params }: { params: { facilityId: string } }
) {
    const supabase = await createServer();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const facilityId = params.facilityId;
        const { searchParams } = new URL(request.url);

        // Parse date range from query params
        const startDate = searchParams.get('startDate') ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = searchParams.get('endDate') ||
            new Date().toISOString();

        // Get KIPU credentials
        // Get KIPU credentials
        const credentials = await serverLoadKipuCredentialsFromSupabase(session.user.id);

        if (!credentials) {
            return NextResponse.json(
                { error: 'KIPU credentials not found for this user' },
                { status: 400 }
            );
        }

        // Create statistics service
        const statsService = new KipuStatisticsService(credentials);

        // Get statistics
        const statistics = await statsService.getFacilityStatistics(
            facilityId,
            { startDate, endDate }
        );

        return NextResponse.json(statistics);
    } catch (error: any) {
        console.error('Error fetching facility statistics:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}