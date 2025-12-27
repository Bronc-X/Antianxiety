/**
 * WeChat OAuth Authentication Utilities
 * 
 * Implements custom WeChat OAuth flow since Supabase doesn't natively support it.
 * This module handles:
 * 1. QR code generation for web login
 * 2. OAuth callback processing
 * 3. User creation/linking in Supabase
 * 
 * Required environment variables:
 * - WECHAT_APP_ID: WeChat Open Platform App ID
 * - WECHAT_APP_SECRET: WeChat Open Platform App Secret
 */

// WeChat OAuth endpoints (for website applications)
const WECHAT_AUTHORIZE_URL = 'https://open.weixin.qq.com/connect/qrconnect';
const WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token';
const WECHAT_USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo';

export interface WeChatConfig {
    appId: string;
    appSecret: string;
    redirectUri: string;
}

export interface WeChatTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}

export interface WeChatUserInfo {
    openid: string;
    nickname: string;
    sex: number;
    province: string;
    city: string;
    country: string;
    headimgurl: string;
    privilege: string[];
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}

/**
 * Generate WeChat QR login URL
 * Opens in a new window or iframe to display QR code
 */
export function generateWeChatLoginUrl(config: WeChatConfig, state: string): string {
    const params = new URLSearchParams({
        appid: config.appId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'snsapi_login',
        state: state,
    });

    return `${WECHAT_AUTHORIZE_URL}?${params.toString()}#wechat_redirect`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
    code: string,
    config: WeChatConfig
): Promise<WeChatTokenResponse> {
    const params = new URLSearchParams({
        appid: config.appId,
        secret: config.appSecret,
        code: code,
        grant_type: 'authorization_code',
    });

    const response = await fetch(`${WECHAT_TOKEN_URL}?${params.toString()}`);
    const data: WeChatTokenResponse = await response.json();

    if (data.errcode) {
        throw new Error(`WeChat token error: ${data.errcode} - ${data.errmsg}`);
    }

    return data;
}

/**
 * Fetch user info from WeChat API
 */
export async function fetchWeChatUserInfo(
    accessToken: string,
    openid: string
): Promise<WeChatUserInfo> {
    const params = new URLSearchParams({
        access_token: accessToken,
        openid: openid,
        lang: 'zh_CN',
    });

    const response = await fetch(`${WECHAT_USERINFO_URL}?${params.toString()}`);
    const data: WeChatUserInfo = await response.json();

    if (data.errcode) {
        throw new Error(`WeChat userinfo error: ${data.errcode} - ${data.errmsg}`);
    }

    return data;
}

/**
 * Get WeChat config from environment
 */
export function getWeChatConfig(): WeChatConfig {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zh.antianxiety.app';

    if (!appId || !appSecret) {
        throw new Error('WeChat credentials not configured. Set WECHAT_APP_ID and WECHAT_APP_SECRET.');
    }

    return {
        appId,
        appSecret,
        redirectUri: `${baseUrl}/api/auth/wechat/callback`,
    };
}

/**
 * Generate a random state parameter for OAuth security
 */
export function generateOAuthState(): string {
    return crypto.randomUUID();
}
