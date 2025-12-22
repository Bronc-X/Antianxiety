/**
 * Wearable OAuth Connect Route
 * 发起穿戴设备OAuth连接
 * 
 * GET /api/wearables/connect/[provider]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getConnector } from '@/lib/services/wearables';
import type { WearableProvider } from '@/types/wearable';

const VALID_PROVIDERS: WearableProvider[] = ['fitbit', 'oura'];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;

        // 验证provider
        if (!VALID_PROVIDERS.includes(provider as WearableProvider)) {
            return NextResponse.json(
                { error: 'Invalid provider', validProviders: VALID_PROVIDERS },
                { status: 400 }
            );
        }

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
                { error: 'Unauthorized', message: 'Please log in to connect wearables' },
                { status: 401 }
            );
        }

        // 获取连接器
        const connector = getConnector(provider as WearableProvider);

        if (!connector) {
            return NextResponse.json(
                { error: 'Provider not configured', message: `${provider} API credentials not set` },
                { status: 503 }
            );
        }

        // 生成state参数（防止CSRF + 携带用户ID）
        const state = Buffer.from(JSON.stringify({
            userId: user.id,
            provider,
            timestamp: Date.now(),
        })).toString('base64url');

        // 获取OAuth授权URL
        const authUrl = connector.getAuthUrl(state);

        // 重定向到OAuth页面
        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('Wearable connect error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
