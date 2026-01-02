import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const { code, provider } = await req.json();

        if (!code || !provider) {
            return NextResponse.json(
                { error: 'Missing code or provider' },
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

        // Mock OAuth exchange for now since we don't have real client secrets
        // In a real app, you would exchange 'code' for 'access_token' and 'refresh_token'
        // using the provider's API

        const mockToken = `mock_token_${Date.now()}`;
        const mockRefreshToken = `mock_refresh_${Date.now()}`;
        const expiresIn = 3600;

        // Save token to database
        const { error: dbError } = await supabase
            .from('wearable_tokens')
            .upsert({
                user_id: user.id,
                provider,
                access_token: mockToken,
                refresh_token: mockRefreshToken,
                expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                updated_at: new Date().toISOString(),
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
