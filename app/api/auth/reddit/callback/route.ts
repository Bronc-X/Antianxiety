import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    exchangeCodeForToken,
    fetchRedditUserInfo,
    getRedditConfig,
} from '@/lib/reddit-auth';

/**
 * Reddit OAuth Callback Handler
 * 
 * Route: GET /api/auth/reddit/callback
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorUrl = '/login?error=reddit_auth_failed';

    // Handle user cancellation
    if (error === 'access_denied') {
        return NextResponse.redirect(new URL('/login?error=auth_cancelled', request.url));
    }

    if (!code) {
        console.error('Reddit callback: Missing authorization code');
        return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    console.log('Reddit OAuth callback received, state:', state);

    try {
        const config = getRedditConfig();

        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code, config);
        console.log('Reddit token exchange successful');

        // Fetch user info
        const userInfo = await fetchRedditUserInfo(tokenResponse.access_token);
        console.log('Reddit user info fetched:', userInfo.name);

        // Create Supabase admin client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Check if user already exists by Reddit ID
        const { data: existingProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('user_id')
            .eq('reddit_id', userInfo.id)
            .single();

        let userId: string;

        if (existingProfile) {
            userId = existingProfile.user_id;
            console.log('Existing Reddit user found:', userId);
        } else {
            // Create new user - Reddit doesn't expose email for most apps
            const generatedEmail = `reddit_${userInfo.id}@reddit.antianxiety.app`;

            // Get avatar URL
            const avatarUrl = userInfo.snoovatar_img || userInfo.icon_img?.split('?')[0];

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: generatedEmail,
                email_confirm: true,
                user_metadata: {
                    provider: 'reddit',
                    reddit_id: userInfo.id,
                    reddit_username: userInfo.name,
                    full_name: userInfo.name,
                    avatar_url: avatarUrl,
                },
            });

            if (createError || !newUser.user) {
                console.error('Failed to create Reddit user:', createError);
                return NextResponse.redirect(new URL(errorUrl, request.url));
            }

            userId = newUser.user.id;
            console.log('New Reddit user created:', userId);

            // Store Reddit ID in user_profiles
            await supabaseAdmin.from('user_profiles').upsert({
                user_id: userId,
                reddit_id: userInfo.id,
                reddit_username: userInfo.name,
                display_name: userInfo.name,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            });
        }

        // Generate a session for the user
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: `reddit_${userInfo.id}@reddit.antianxiety.app`,
            options: {
                redirectTo: 'https://en.antianxiety.app/landing',
            },
        });

        if (sessionError || !sessionData.properties?.hashed_token) {
            console.error('Failed to generate session:', sessionError);
            return NextResponse.redirect(new URL('/login?reddit=success', request.url));
        }

        const magicLinkUrl = sessionData.properties.action_link;
        return NextResponse.redirect(magicLinkUrl);

    } catch (err) {
        console.error('Reddit OAuth error:', err);
        return NextResponse.redirect(new URL(errorUrl, request.url));
    }
}
