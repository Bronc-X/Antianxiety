import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    exchangeCodeForToken,
    fetchWeChatUserInfo,
    getWeChatConfig,
} from '@/lib/wechat-auth';

/**
 * WeChat OAuth Callback Handler
 * 
 * Route: GET /api/auth/wechat/callback
 * 
 * Handles the OAuth callback from WeChat:
 * 1. Exchange authorization code for access token
 * 2. Fetch user info from WeChat
 * 3. Create or link user in Supabase
 * 4. Set session and redirect to app
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorUrl = '/login?error=wechat_auth_failed';

    // Validate required parameters
    if (!code) {
        console.error('WeChat callback: Missing authorization code');
        return NextResponse.redirect(new URL(errorUrl, request.url));
    }

    // TODO: Validate state parameter against stored session state
    // This prevents CSRF attacks
    console.log('WeChat OAuth callback received, state:', state);

    try {
        // Get WeChat configuration
        const config = getWeChatConfig();

        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code, config);
        console.log('WeChat token exchange successful, openid:', tokenResponse.openid);

        // Fetch user info
        const userInfo = await fetchWeChatUserInfo(
            tokenResponse.access_token,
            tokenResponse.openid
        );
        console.log('WeChat user info fetched:', userInfo.nickname);

        // Create Supabase admin client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Check if user already exists by WeChat openid
        const { data: existingProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('user_id')
            .eq('wechat_openid', tokenResponse.openid)
            .single();

        let userId: string;

        if (existingProfile) {
            // User exists, use their existing account
            userId = existingProfile.user_id;
            console.log('Existing WeChat user found:', userId);
        } else {
            // Create new user with WeChat identity
            // Generate a unique email for the user (WeChat doesn't provide email)
            const generatedEmail = `wechat_${tokenResponse.openid}@wechat.antianxiety.app`;

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: generatedEmail,
                email_confirm: true,
                user_metadata: {
                    provider: 'wechat',
                    wechat_openid: tokenResponse.openid,
                    wechat_unionid: tokenResponse.unionid,
                    nickname: userInfo.nickname,
                    avatar_url: userInfo.headimgurl,
                    full_name: userInfo.nickname,
                },
            });

            if (createError || !newUser.user) {
                console.error('Failed to create WeChat user:', createError);
                return NextResponse.redirect(new URL(errorUrl, request.url));
            }

            userId = newUser.user.id;
            console.log('New WeChat user created:', userId);

            // Store WeChat openid in user_profiles for future lookups
            await supabaseAdmin.from('user_profiles').upsert({
                user_id: userId,
                wechat_openid: tokenResponse.openid,
                wechat_unionid: tokenResponse.unionid,
                display_name: userInfo.nickname,
                avatar_url: userInfo.headimgurl,
                updated_at: new Date().toISOString(),
            });
        }

        // Generate a session for the user
        // We use a magic link approach - generate a one-time token
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: `wechat_${tokenResponse.openid}@wechat.antianxiety.app`,
            options: {
                redirectTo: 'https://zh.antianxiety.app/landing',
            },
        });

        if (sessionError || !sessionData.properties?.hashed_token) {
            console.error('Failed to generate session:', sessionError);
            // Fallback: redirect to login with success message
            return NextResponse.redirect(new URL('/login?wechat=success', request.url));
        }

        // Redirect to the magic link URL which will establish the session
        const magicLinkUrl = sessionData.properties.action_link;
        return NextResponse.redirect(magicLinkUrl);

    } catch (error) {
        console.error('WeChat OAuth error:', error);
        return NextResponse.redirect(new URL(errorUrl, request.url));
    }
}
