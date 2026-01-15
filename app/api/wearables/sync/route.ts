/**
 * Wearable Data Sync Route
 * 同步穿戴设备数据
 * 
 * POST /api/wearables/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getConnector } from '@/lib/services/wearables';
import type { WearableProvider } from '@/types/wearable';

interface SyncRequest {
    provider?: WearableProvider;
    daysBack?: number;
}

type HealthDataRow = {
    data_type: string;
    value?: number | string | null;
    score?: number | string | null;
    quality?: number | string | null;
    metadata?: unknown;
    recorded_at: string;
    source?: string | null;
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: SyncRequest = await request.json().catch(() => ({}));
        const { provider, daysBack = 7 } = body;

        // 验证用户登录状态
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 获取用户的穿戴设备令牌
        let tokenQuery = supabase
            .from('wearable_tokens')
            .select('*')
            .eq('user_id', user.id);

        if (provider) {
            tokenQuery = tokenQuery.eq('provider', provider);
        }

        const { data: tokens, error: tokensError } = await tokenQuery;

        if (tokensError || !tokens || tokens.length === 0) {
            return NextResponse.json(
                { error: 'No connected wearables', connected: [] },
                { status: 404 }
            );
        }

        // 计算日期范围
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        // 同步每个设备的数据
        const results: {
            provider: WearableProvider;
            success: boolean;
            recordsSynced: number;
            error?: string;
        }[] = [];

        for (const token of tokens) {
            const connector = getConnector(token.provider as WearableProvider);

            if (!connector) {
                results.push({
                    provider: token.provider,
                    success: false,
                    recordsSynced: 0,
                    error: 'Connector not available',
                });
                continue;
            }

            // 记录同步开始
            await supabase.from('wearable_sync_log').insert({
                user_id: user.id,
                provider: token.provider,
                sync_type: 'incremental',
                status: 'started',
                date_range_start: startDate.toISOString().split('T')[0],
                date_range_end: endDate.toISOString().split('T')[0],
            });

            try {
                // 检查令牌是否过期
                if (token.expires_at && new Date(token.expires_at) < new Date()) {
                    // 尝试刷新令牌
                    if (token.refresh_token) {
                        const refreshResult = await connector.refreshToken(token.refresh_token);

                        // 更新令牌
                        await supabase.from('wearable_tokens').update({
                            access_token: refreshResult.accessToken,
                            refresh_token: refreshResult.refreshToken,
                            expires_at: refreshResult.expiresIn
                                ? new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString()
                                : null,
                            updated_at: new Date().toISOString(),
                        }).eq('id', token.id);

                        token.access_token = refreshResult.accessToken;
                    } else {
                        throw new Error('Token expired and no refresh token available');
                    }
                }

                // 获取数据
                const healthData = await connector.fetchData(
                    token.access_token,
                    startDate,
                    endDate
                );

                // 存储数据
                let recordsSynced = 0;
                for (const data of healthData) {
                    const { error: insertError } = await supabase
                        .from('user_health_data')
                        .upsert({
                            user_id: user.id,
                            source: data.source,
                            data_type: data.dataType,
                            recorded_at: data.recordedAt.toISOString(),
                            value: data.value,
                            score: data.score,
                            quality: data.quality,
                            metadata: data.metadata,
                            raw_data: data.rawData,
                        }, {
                            onConflict: 'user_id,source,data_type,recorded_at',
                        });

                    if (!insertError) {
                        recordsSynced++;
                    }
                }

                // 更新同步日志
                await supabase.from('wearable_sync_log').insert({
                    user_id: user.id,
                    provider: token.provider,
                    sync_type: 'incremental',
                    status: 'success',
                    records_synced: recordsSynced,
                    duration_ms: Date.now() - startTime,
                });

                // 更新最后同步时间
                await supabase.from('wearable_tokens').update({
                    last_sync_at: new Date().toISOString(),
                }).eq('id', token.id);

                results.push({
                    provider: token.provider,
                    success: true,
                    recordsSynced,
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                // 记录失败
                await supabase.from('wearable_sync_log').insert({
                    user_id: user.id,
                    provider: token.provider,
                    sync_type: 'incremental',
                    status: 'failed',
                    error_message: errorMessage,
                    duration_ms: Date.now() - startTime,
                });

                results.push({
                    provider: token.provider,
                    success: false,
                    recordsSynced: 0,
                    error: errorMessage,
                });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            durationMs: Date.now() - startTime,
        });

    } catch (error) {
        console.error('Wearable sync error:', error);
        return NextResponse.json(
            { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(_request: NextRequest) {
    try {
        void _request;
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', connections: {}, connectedDevices: [], recentSyncs: [] },
                { status: 401 }
            );
        }

        const { data: tokens } = await supabase
            .from('wearable_tokens')
            .select('provider, last_sync_at, expires_at, device_name')
            .eq('user_id', user.id);

        const connections: Record<string, { connected: boolean; lastSync?: string }> = {};
        tokens?.forEach((token) => {
            connections[token.provider] = {
                connected: true,
                lastSync: token.last_sync_at ? new Date(token.last_sync_at).toLocaleString() : undefined,
            };
        });

        const { data: healthData } = await supabase
            .from('user_health_data')
            .select('data_type, value, score, quality, metadata, recorded_at, source')
            .eq('user_id', user.id)
            .in('data_type', [
                'hrv',
                'sleep',
                'activity',
                'sleep_score',
                'deep_sleep_minutes',
                'rem_sleep_minutes',
                'light_sleep_minutes',
                'steps',
                'active_calories',
            ])
            .order('recorded_at', { ascending: false })
            .limit(100);

        const latestByType: Record<string, HealthDataRow> = {};
        const latestBySource: Record<string, string> = {};
        healthData?.forEach((item: HealthDataRow) => {
            if (!latestByType[item.data_type]) {
                latestByType[item.data_type] = item;
            }
            if (item.source && !latestBySource[item.source]) {
                latestBySource[item.source] = item.recorded_at;
            }
        });

        const hrvRow = latestByType.hrv;
        const sleepRow = latestByType.sleep;
        const sleepScoreRow = latestByType.sleep_score;
        const deepRow = latestByType.deep_sleep_minutes;
        const remRow = latestByType.rem_sleep_minutes;
        const lightRow = latestByType.light_sleep_minutes;
        const activityRow = latestByType.activity;
        const stepsRow = latestByType.steps;
        const caloriesRow = latestByType.active_calories;

        const appleHealthSync = latestBySource.apple_health || latestBySource.healthkit;
        if (appleHealthSync) {
            connections.healthkit = {
                connected: true,
                lastSync: new Date(appleHealthSync).toLocaleString(),
            };
        }
        if (latestBySource.health_connect) {
            connections.health_connect = {
                connected: true,
                lastSync: new Date(latestBySource.health_connect).toLocaleString(),
            };
        }

        let latestData: Record<string, unknown> | null = null;

        if (hrvRow && (typeof hrvRow.value === 'number' || typeof hrvRow.score === 'number')) {
            const hrvValue = Math.round(Number(hrvRow.value ?? hrvRow.score));
            const quality = hrvRow.quality as string | undefined;
            const statusMap: Record<string, 'low' | 'normal' | 'good' | 'excellent'> = {
                poor: 'low',
                fair: 'normal',
                good: 'good',
                excellent: 'excellent',
            };
            const status = statusMap[quality || 'good'] || 'good';

            const sleepMinutesFromSummary = sleepRow?.value ? Number(sleepRow.value) : null;
            const sleepMinutesFromStages = [deepRow?.value, remRow?.value, lightRow?.value]
                .filter((val) => typeof val === 'number')
                .reduce((sum: number, val: number) => sum + val, 0);
            const totalSleepMinutes = sleepMinutesFromSummary || (sleepMinutesFromStages > 0 ? sleepMinutesFromStages : null);
            const sleepHours = totalSleepMinutes
                ? (totalSleepMinutes > 24 ? totalSleepMinutes / 60 : totalSleepMinutes)
                : null;
            const deepMinutes = deepRow?.value ? Number(deepRow.value) : sleepRow?.metadata?.deepMinutes ? Number(sleepRow.metadata.deepMinutes) : null;
            const remMinutes = remRow?.value ? Number(remRow.value) : sleepRow?.metadata?.remMinutes ? Number(sleepRow.metadata.remMinutes) : null;
            const sleepQualityScore = sleepScoreRow?.value ?? sleepRow?.score ?? null;

            latestData = {
                hrv: {
                    value: hrvValue,
                    status,
                    trend: 0,
                    lastUpdated: hrvRow.recorded_at ? new Date(hrvRow.recorded_at).toLocaleString() : '—',
                },
                sleep: sleepHours
                    ? {
                        duration: Math.round(sleepHours * 10) / 10,
                        quality: sleepQualityScore ? Math.round(Number(sleepQualityScore)) : 0,
                        deepSleep: deepMinutes ? Math.round((deepMinutes / 60) * 10) / 10 : 0,
                        remSleep: remMinutes ? Math.round((remMinutes / 60) * 10) / 10 : 0,
                    }
                    : null,
                activity: activityRow || stepsRow || caloriesRow
                    ? {
                        steps: stepsRow?.value
                            ? Number(stepsRow.value)
                            : activityRow?.metadata?.steps
                                ? Number(activityRow.metadata.steps)
                                : Math.round(Number(activityRow?.value || 0)),
                        calories: caloriesRow?.value
                            ? Number(caloriesRow.value)
                            : activityRow?.metadata?.calories
                                ? Number(activityRow.metadata.calories)
                                : 0,
                        activeMinutes: activityRow?.metadata?.activeMinutes
                            ? Number(activityRow.metadata.activeMinutes)
                            : 0,
                    }
                    : null,
            };
        }

        const { data: recentSyncs } = await supabase
            .from('wearable_sync_log')
            .select('*')
            .eq('user_id', user.id)
            .order('synced_at', { ascending: false })
            .limit(10);

        const connectedDevices = tokens ? [...tokens] : [];
        const connectedProviders = new Set(connectedDevices.map((token) => token.provider));
        if (appleHealthSync && !connectedProviders.has('healthkit')) {
            connectedDevices.push({
                provider: 'healthkit',
                device_name: 'HealthKit',
                last_sync_at: appleHealthSync,
                expires_at: null,
            });
        }
        if (latestBySource.health_connect && !connectedProviders.has('health_connect')) {
            connectedDevices.push({
                provider: 'health_connect',
                device_name: 'Health Connect',
                last_sync_at: latestBySource.health_connect,
                expires_at: null,
            });
        }

        return NextResponse.json({
            connections,
            latestData,
            connectedDevices,
            recentSyncs: recentSyncs || [],
        });
    } catch (error) {
        console.error('Wearables sync GET error:', error);
        return NextResponse.json(
            { error: 'Failed to load wearable status', connections: {}, connectedDevices: [], recentSyncs: [] },
            { status: 500 }
        );
    }
}
