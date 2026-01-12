import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getConnector } from '@/lib/services/wearables';
import type { WearableProvider } from '@/types/wearable';

export async function POST(req: NextRequest) {
    try {
        const { code, provider, redirectUri } = await req.json();

        if (!code || typeof code !== 'string' || !provider || typeof provider !== 'string') {
            return NextResponse.json(
                { error: 'Missing code or provider' },
                { status: 400 }
            );
        }

        const normalizedProvider = provider as WearableProvider;
        const connector = getConnector(normalizedProvider);
        if (!connector) {
            return NextResponse.json(
                { error: 'Provider not supported' },
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

        const redirectOverride = typeof redirectUri === 'string' && redirectUri.trim().length > 0
            ? redirectUri.trim()
            : undefined;
        const tokenResult = await connector.exchangeCode(code, redirectOverride);
        const expiresIn = tokenResult.expiresIn || null;
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        // Save token to database
        const { error: dbError } = await supabase
            .from('wearable_tokens')
            .upsert({
                user_id: user.id,
                provider: normalizedProvider,
                access_token: tokenResult.accessToken,
                refresh_token: tokenResult.refreshToken,
                expires_at: expiresAt,
                scope: tokenResult.scope,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,provider',
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to save token' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
