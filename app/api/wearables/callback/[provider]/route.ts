/**
 * Wearable OAuth Callback Route
 * 处理穿戴设备OAuth回调
 * 
 * GET /api/wearables/callback/[provider]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getConnector } from '@/lib/services/wearables';
import type { WearableProvider } from '@/types/wearable';

const VALID_PROVIDERS: WearableProvider[] = ['fitbit', 'oura'];

interface StatePayload {
    userId: string;
    provider: string;
    timestamp: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // 处理OAuth错误
        if (error) {
            const errorDescription = searchParams.get('error_description') || 'Authorization failed';
            return NextResponse.redirect(
                new URL(`/settings?wearable_error=${encodeURIComponent(errorDescription)}`, request.url)
            );
        }

        // 验证必要参数
        if (!code || !state) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Missing+authorization+code', request.url)
            );
        }

        // 验证provider
        if (!VALID_PROVIDERS.includes(provider as WearableProvider)) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Invalid+provider', request.url)
            );
        }

        // 解析state
        let statePayload: StatePayload;
        try {
            statePayload = JSON.parse(Buffer.from(state, 'base64url').toString());
        } catch {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Invalid+state', request.url)
            );
        }

        // 验证state时效性（10分钟内有效）
        if (Date.now() - statePayload.timestamp > 10 * 60 * 1000) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Authorization+expired', request.url)
            );
        }

        // 验证provider匹配
        if (statePayload.provider !== provider) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Provider+mismatch', request.url)
            );
        }

        // 验证用户身份
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

        if (authError || !user || user.id !== statePayload.userId) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Session+mismatch', request.url)
            );
        }

        // 获取连接器并交换token
        const connector = getConnector(provider as WearableProvider);

        if (!connector) {
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Provider+not+configured', request.url)
            );
        }

        const tokenResult = await connector.exchangeCode(code);

        // 计算过期时间
        const expiresAt = tokenResult.expiresIn
            ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString()
            : null;

        // 存储token到数据库
        const { error: upsertError } = await supabase
            .from('wearable_tokens')
            .upsert({
                user_id: user.id,
                provider,
                access_token: tokenResult.accessToken,
                refresh_token: tokenResult.refreshToken,
                expires_at: expiresAt,
                scope: tokenResult.scope,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,provider',
            });

        if (upsertError) {
            console.error('Failed to store wearable token:', upsertError);
            return NextResponse.redirect(
                new URL('/settings?wearable_error=Failed+to+save+connection', request.url)
            );
        }

        // 成功，重定向回设置页面
        return NextResponse.redirect(
            new URL(`/settings?wearable_connected=${provider}`, request.url)
        );

    } catch (error) {
        console.error('Wearable callback error:', error);
        return NextResponse.redirect(
            new URL('/settings?wearable_error=Connection+failed', request.url)
        );
    }
}
