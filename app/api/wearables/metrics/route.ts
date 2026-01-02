import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const { provider, startDate, endDate } = await req.json();

        if (!provider || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has token for this provider
        const { data: token, error: tokenError } = await supabase
            .from('wearable_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', provider)
            .single();

        if (tokenError || !token) {
            return NextResponse.json(
                { error: 'Provider not connected' },
                { status: 400 }
            );
        }

        // Mock data generation for demo purposes
        // In real app, fetch from provider API using token.access_token
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const sleep = [];
        const heartRate = [];
        const activity = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            sleep.push({
                date: dateStr,
                duration: 420 + Math.random() * 60, // 7-8 hours
                quality: 70 + Math.random() * 20,
                stages: [],
                efficiency: 85 + Math.random() * 10,
                latency: 10 + Math.random() * 20,
            });

            heartRate.push({
                date: dateStr,
                avg: 65 + Math.random() * 10,
                min: 50 + Math.random() * 5,
                max: 120 + Math.random() * 20,
                hrv: 40 + Math.random() * 20,
                restingHr: 55 + Math.random() * 5,
            });

            activity.push({
                date: dateStr,
                steps: 5000 + Math.floor(Math.random() * 5000),
                calories: 2000 + Math.floor(Math.random() * 500),
                activeMinutes: 30 + Math.floor(Math.random() * 60),
                distance: 3000 + Math.floor(Math.random() * 3000),
            });
        }

        return NextResponse.json({
            sleep,
            heartRate,
            activity,
        });

    } catch (error) {
        console.error('Metrics error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
