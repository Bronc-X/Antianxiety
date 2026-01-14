import { NextRequest, NextResponse } from 'next/server';
import { getWeChatConfig, generateOAuthState, generateWeChatLoginUrl } from '@/lib/wechat-auth';

/**
 * WeChat QR Login Initiation
 * 
 * Route: GET /api/auth/wechat/qr
 * 
 * Returns the WeChat QR login URL that the frontend can use
 * to display the QR code or redirect the user.
 */
export async function GET(request: NextRequest) {
    try {
        void request;
        const config = getWeChatConfig();
        const state = generateOAuthState();

        // Generate the WeChat login URL
        const loginUrl = generateWeChatLoginUrl(config, state);

        // TODO: Store state in a temporary session/cache for validation
        // For now, we'll just return the URL

        return NextResponse.json({
            success: true,
            loginUrl,
            state,
            qrUrl: loginUrl, // Same URL - WeChat will show QR code
        });

    } catch (error) {
        console.error('Failed to generate WeChat QR URL:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'WeChat configuration missing. Please contact support.'
            },
            { status: 500 }
        );
    }
}
