/**
 * API Route: Profile Sync
 * 
 * Triggers user profile aggregation.
 * Called after form submissions, chat sessions, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aggregateUserProfile } from '@/lib/user-profile-aggregator';

export async function POST(request: NextRequest) {
    try {
        void request;
        const supabase = await createServerSupabaseClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Trigger aggregation
        const result = await aggregateUserProfile(user.id);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Aggregation failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Profile aggregated successfully',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in profile-sync API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
