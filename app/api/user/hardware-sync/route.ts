/**
 * Hardware Health Data Sync API
 * 
 * Receives health data from wearable devices (Apple Health, Health Connect)
 * and stores it in the unified profile system.
 * 
 * POST /api/user/hardware-sync
 * 
 * Body: {
 *   source: 'healthkit' | 'apple_health' | 'health_connect',
 *   data: {
 *     hrv?: number,           // Heart Rate Variability (ms)
 *     resting_heart_rate?: number,
 *     sleep_score?: number,   // 0-100
 *     sleep_minutes?: number, // Total sleep minutes (when stages unavailable)
 *     deep_sleep_minutes?: number,
 *     rem_sleep_minutes?: number,
 *     light_sleep_minutes?: number,
 *     body_temperature?: number, // Celsius deviation from baseline
 *     respiratory_rate?: number,
 *     spo2?: number,          // Blood oxygen percentage  
 *     steps?: number,
 *     active_calories?: number,
 *     recorded_at?: string,   // ISO timestamp
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

interface HardwareData {
    hrv?: number;
    resting_heart_rate?: number;
    sleep_score?: number;
    sleep_minutes?: number;
    deep_sleep_minutes?: number;
    rem_sleep_minutes?: number;
    light_sleep_minutes?: number;
    body_temperature?: number;
    respiratory_rate?: number;
    spo2?: number;
    steps?: number;
    active_calories?: number;
    recorded_at?: string;
}

interface SyncRequest {
    source: 'healthkit' | 'apple_health' | 'health_connect';
    data: HardwareData;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: SyncRequest = await request.json();
        const { source, data } = body;
        const normalizedSource = source === 'apple_health' ? 'healthkit' : source;

        if (!source || !data) {
            return NextResponse.json({ error: 'Missing source or data' }, { status: 400 });
        }

        const recordedAt = data.recorded_at || new Date().toISOString();
        const today = recordedAt.split('T')[0];

        console.log(`📡 [Hardware Sync] User: ${user.id}, Source: ${normalizedSource}`);
        console.log(`   HRV: ${data.hrv}, Sleep Score: ${data.sleep_score}, Sleep Minutes: ${data.sleep_minutes}`);

        // 1. Store individual data points to user_health_data table
        const dataPoints: Array<{ data_type: string; value: number; source: string; recorded_at: string }> = [];

        if (data.hrv !== undefined) {
            dataPoints.push({ data_type: 'hrv', value: data.hrv, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.resting_heart_rate !== undefined) {
            dataPoints.push({ data_type: 'resting_heart_rate', value: data.resting_heart_rate, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.sleep_score !== undefined) {
            dataPoints.push({ data_type: 'sleep_score', value: data.sleep_score, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.sleep_minutes !== undefined) {
            dataPoints.push({ data_type: 'sleep', value: data.sleep_minutes, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.deep_sleep_minutes !== undefined) {
            dataPoints.push({ data_type: 'deep_sleep_minutes', value: data.deep_sleep_minutes, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.rem_sleep_minutes !== undefined) {
            dataPoints.push({ data_type: 'rem_sleep_minutes', value: data.rem_sleep_minutes, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.light_sleep_minutes !== undefined) {
            dataPoints.push({ data_type: 'light_sleep_minutes', value: data.light_sleep_minutes, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.spo2 !== undefined) {
            dataPoints.push({ data_type: 'spo2', value: data.spo2, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.steps !== undefined) {
            dataPoints.push({ data_type: 'steps', value: data.steps, source: normalizedSource, recorded_at: recordedAt });
        }
        if (data.active_calories !== undefined) {
            dataPoints.push({ data_type: 'active_calories', value: data.active_calories, source: normalizedSource, recorded_at: recordedAt });
        }

        // Insert data points
        if (dataPoints.length > 0) {
            const { error: insertError } = await supabase
                .from('user_health_data')
                .insert(dataPoints.map(dp => ({
                    user_id: user.id,
                    ...dp,
                })));

            if (insertError) {
                console.error('Error inserting health data:', insertError);
            }
        }

        // 2. Update today's daily_wellness_logs with hardware data
        if (data.hrv || data.sleep_score || data.deep_sleep_minutes || data.sleep_minutes || data.rem_sleep_minutes || data.light_sleep_minutes) {
            const updateFields: Record<string, unknown> = {};

            // Map hardware data to daily log fields
            const stageMinutes = [data.deep_sleep_minutes, data.rem_sleep_minutes, data.light_sleep_minutes]
                .filter((value): value is number => typeof value === 'number');
            const totalStageMinutes = stageMinutes.reduce((sum, value) => sum + value, 0);

            if (totalStageMinutes > 0) {
                updateFields.sleep_duration_minutes = totalStageMinutes;
            } else if (data.sleep_minutes !== undefined) {
                updateFields.sleep_duration_minutes = data.sleep_minutes;
            }

            if (Object.keys(updateFields).length > 0) {
                await supabase
                    .from('daily_wellness_logs')
                    .upsert({
                        user_id: user.id,
                        log_date: today,
                        ...updateFields,
                    }, {
                        onConflict: 'user_id,log_date',
                    });
            }
        }

        // 3. Trigger profile sync to update unified profile
        const cookieHeader = request.headers.get('cookie') ?? '';
        await fetch(new URL('/api/user/refresh', request.url), {
            method: 'POST',
            headers: { cookie: cookieHeader },
        }).catch(() => {});
        await fetch(new URL('/api/user/profile-sync', request.url), {
            method: 'POST',
            headers: { cookie: cookieHeader },
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            dataPointsStored: dataPoints.length,
            source: normalizedSource,
        });

    } catch (error) {
        console.error('[Hardware Sync] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/user/hardware-sync
 * 
 * Returns latest hardware data for the user
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get latest data points by type
        const { data: healthData } = await supabase
            .from('user_health_data')
            .select('data_type, value, source, recorded_at')
            .eq('user_id', user.id)
            .order('recorded_at', { ascending: false })
            .limit(20);

        // Group by data type, take latest of each
        const latestByType: Record<string, { value: number; source: string; recorded_at: string }> = {};

        if (healthData) {
            for (const item of healthData) {
                if (!latestByType[item.data_type]) {
                    latestByType[item.data_type] = {
                        value: item.value,
                        source: item.source,
                        recorded_at: item.recorded_at,
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: latestByType,
        });

    } catch (error) {
        console.error('[Hardware Sync GET] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
