import { NextResponse } from 'next/server';
import { getRedditConfig, generateOAuthState, generateRedditLoginUrl } from '@/lib/reddit-auth';

/**
 * Reddit Login Initiation
 * 
 * Route: GET /api/auth/reddit
 * 
 * Redirects user to Reddit authorization page.
 */
export async function GET() {
    try {
        const config = getRedditConfig();
        const state = generateOAuthState();

        const loginUrl = generateRedditLoginUrl(config, state);

        // TODO: Store state in cookie/session for CSRF validation

        return NextResponse.redirect(loginUrl);

    } catch (error) {
        console.error('Failed to initiate Reddit login:', error);
        return NextResponse.redirect('/login?error=reddit_config_missing');
    }
}
