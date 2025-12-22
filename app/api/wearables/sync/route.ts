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
import type { WearableProvider, NormalizedHealthData } from '@/types/wearable';

interface SyncRequest {
    provider?: WearableProvider;
    daysBack?: number;
}

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

// GET: 获取同步状态
export async function GET(request: NextRequest) {
    try {
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 获取已连接设备
        const { data: tokens } = await supabase
            .from('wearable_tokens')
            .select('provider, device_name, last_sync_at, expires_at')
            .eq('user_id', user.id);

        // 获取最近同步日志
        const { data: recentSyncs } = await supabase
            .from('wearable_sync_log')
            .select('*')
            .eq('user_id', user.id)
            .order('synced_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            connectedDevices: tokens || [],
            recentSyncs: recentSyncs || [],
        });

    } catch (error) {
        console.error('Wearable status error:', error);
        return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }
}
