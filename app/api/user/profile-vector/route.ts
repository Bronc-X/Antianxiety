/**
 * API Route: Profile Vector
 * 
 * Returns the user's unified profile embedding for similarity search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUnifiedProfile, shouldReaggregate, aggregateUserProfile } from '@/lib/user-profile-aggregator';

export async function GET(request: NextRequest) {
    try {
        void request;
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if re-aggregation is needed
        const needsRefresh = await shouldReaggregate(user.id);
        if (needsRefresh) {
            // Trigger async aggregation (don't wait)
            aggregateUserProfile(user.id).catch(console.error);
        }

        // Get current profile
        const profile = await getUnifiedProfile(user.id);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found', needsSync: true },
                { status: 404 }
            );
        }

        // Return profile without the raw embedding (too large)
        return NextResponse.json({
            demographics: profile.demographics,
            health_goals: profile.health_goals,
            lifestyle_factors: profile.lifestyle_factors,
            health_concerns: profile.health_concerns,
            recent_mood_trend: profile.recent_mood_trend,
            ai_inferred_traits: profile.ai_inferred_traits,
            profile_text: profile.profile_text,
            has_embedding: !!profile.profile_embedding,
            last_aggregated_at: profile.last_aggregated_at,
            needs_refresh: needsRefresh,
        });

    } catch (error) {
        console.error('Error in profile-vector API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
