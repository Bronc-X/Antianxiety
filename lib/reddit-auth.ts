/**
 * Reddit OAuth Authentication Utilities
 * 
 * Implements custom Reddit OAuth flow since Supabase doesn't natively support it.
 * 
 * Required environment variables:
 * - REDDIT_CLIENT_ID: Reddit OAuth App Client ID
 * - REDDIT_CLIENT_SECRET: Reddit OAuth App Secret
 */

const REDDIT_AUTHORIZE_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_USER_URL = 'https://oauth.reddit.com/api/v1/me';

export interface RedditConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface RedditTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    refresh_token?: string;
    error?: string;
}

export interface RedditUserInfo {
    id: string;
    name: string;
    icon_img: string;
    snoovatar_img?: string;
    created: number;
    created_utc: number;
    has_verified_email: boolean;
    error?: string;
}

/**
 * Generate Reddit OAuth authorization URL
 */
export function generateRedditLoginUrl(config: RedditConfig, state: string): string {
    const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        state: state,
        redirect_uri: config.redirectUri,
        duration: 'permanent',
        scope: 'identity',
    });

    return `${REDDIT_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
    code: string,
    config: RedditConfig
): Promise<RedditTokenResponse> {
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await fetch(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'AntiAnxiety/1.0',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.redirectUri,
        }).toString(),
    });

    const data: RedditTokenResponse = await response.json();

    if (data.error) {
        throw new Error(`Reddit token error: ${data.error}`);
    }

    return data;
}

/**
 * Fetch user info from Reddit API
 */
export async function fetchRedditUserInfo(
    accessToken: string
): Promise<RedditUserInfo> {
    const response = await fetch(REDDIT_USER_URL, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'AntiAnxiety/1.0',
        },
    });

    const data: RedditUserInfo = await response.json();

    if (data.error) {
        throw new Error(`Reddit user error: ${data.error}`);
    }

    return data;
}

/**
 * Get Reddit config from environment
 */
export function getRedditConfig(): RedditConfig {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://antianxiety.app';

    if (!clientId || !clientSecret) {
        throw new Error('Reddit credentials not configured. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.');
    }

    return {
        clientId,
        clientSecret,
        redirectUri: `${baseUrl}/api/auth/reddit/callback`,
    };
}

/**
 * Generate a random state parameter for OAuth security
 */
export function generateOAuthState(): string {
    return crypto.randomUUID();
}
