/**
 * Hardware Health Data Sync API
 * 
 * Receives health data from wearable devices (Fitbit, Oura, Apple Health, Health Connect)
 * and stores it in the unified profile system.
 * 
 * POST /api/user/hardware-sync
 * 
 * Body: {
 *   source: 'fitbit' | 'oura' | 'apple_health' | 'health_connect',
 *   data: {
 *     hrv?: number,           // Heart Rate Variability (ms)
 *     resting_heart_rate?: number,
 *     sleep_score?: number,   // 0-100
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
    source: 'fitbit' | 'oura' | 'apple_health' | 'health_connect';
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

        if (!source || !data) {
            return NextResponse.json({ error: 'Missing source or data' }, { status: 400 });
        }

        const recordedAt = data.recorded_at || new Date().toISOString();
        const today = recordedAt.split('T')[0];

        console.log(`📡 [Hardware Sync] User: ${user.id}, Source: ${source}`);
        console.log(`   HRV: ${data.hrv}, Sleep Score: ${data.sleep_score}`);

        // 1. Store individual data points to user_health_data table
        const dataPoints: Array<{ data_type: string; value: number; source: string; recorded_at: string }> = [];

        if (data.hrv !== undefined) {
            dataPoints.push({ data_type: 'hrv', value: data.hrv, source, recorded_at: recordedAt });
        }
        if (data.resting_heart_rate !== undefined) {
            dataPoints.push({ data_type: 'resting_heart_rate', value: data.resting_heart_rate, source, recorded_at: recordedAt });
        }
        if (data.sleep_score !== undefined) {
            dataPoints.push({ data_type: 'sleep_score', value: data.sleep_score, source, recorded_at: recordedAt });
        }
        if (data.deep_sleep_minutes !== undefined) {
            dataPoints.push({ data_type: 'deep_sleep_minutes', value: data.deep_sleep_minutes, source, recorded_at: recordedAt });
        }
        if (data.spo2 !== undefined) {
            dataPoints.push({ data_type: 'spo2', value: data.spo2, source, recorded_at: recordedAt });
        }
        if (data.steps !== undefined) {
            dataPoints.push({ data_type: 'steps', value: data.steps, source, recorded_at: recordedAt });
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
        if (data.hrv || data.sleep_score || data.deep_sleep_minutes) {
            const updateFields: Record<string, unknown> = {};

            // Map hardware data to daily log fields
            if (data.deep_sleep_minutes !== undefined && data.rem_sleep_minutes !== undefined && data.light_sleep_minutes !== undefined) {
                const totalSleep = data.deep_sleep_minutes + data.rem_sleep_minutes + data.light_sleep_minutes;
                updateFields.sleep_duration_minutes = totalSleep;
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
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/user/profile-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => console.log('Profile sync triggered after hardware sync'));

        return NextResponse.json({
            success: true,
            dataPointsStored: dataPoints.length,
            source,
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
